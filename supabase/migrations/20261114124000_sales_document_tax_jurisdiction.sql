-- Store the tax jurisdiction and supply treatment as document snapshots.
-- Document line-item tax_rate is already persisted by save_sales_document.
-- CGST/SGST and IGST breakdown is computed from that rate and this saved treatment.
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS tax_country_code text,
  ADD COLUMN IF NOT EXISTS tax_supply_type text;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_country_code text,
  ADD COLUMN IF NOT EXISTS tax_supply_type text;

ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_tax_supply_type_check;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_tax_supply_type_check;
ALTER TABLE public.quotes ADD CONSTRAINT quotes_tax_supply_type_check CHECK (
  tax_supply_type IS NULL OR tax_supply_type IN ('intra_state','inter_state')
);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_tax_supply_type_check CHECK (
  tax_supply_type IS NULL OR tax_supply_type IN ('intra_state','inter_state')
);

CREATE OR REPLACE FUNCTION public.save_sales_document(
  _kind text, _workspace_id uuid, _document_id uuid, _header jsonb, _lines jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  _id uuid := COALESCE(_document_id, gen_random_uuid());
  _line jsonb;
  _position integer := 0;
  _reference uuid;
  _field text;
  _relation text;
  _allowed boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_workspace_member(_workspace_id, auth.uid()) THEN
    RAISE EXCEPTION 'Workspace access denied' USING ERRCODE = '42501';
  END IF;
  IF _kind NOT IN ('invoice','quote') OR jsonb_typeof(_lines) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid document input';
  END IF;
  -- Every foreign reference must belong to this document's workspace.
  FOREACH _field IN ARRAY ARRAY['contact_id','company_id','deal_id','quote_id'] LOOP
    _reference := NULLIF(_header->>_field, '')::uuid;
    IF _reference IS NOT NULL THEN
      _relation := CASE _field WHEN 'contact_id' THEN 'contacts' WHEN 'company_id' THEN 'companies'
        WHEN 'deal_id' THEN 'deals' ELSE 'quotes' END;
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id=$1 AND workspace_id=$2)', _relation)
        INTO _allowed USING _reference, _workspace_id;
      IF NOT _allowed THEN RAISE EXCEPTION 'Related record is outside the workspace' USING ERRCODE='42501'; END IF;
    END IF;
  END LOOP;
  IF _kind = 'quote' THEN
    IF _document_id IS NOT NULL THEN
      PERFORM 1 FROM public.quotes WHERE id=_id AND workspace_id=_workspace_id AND deleted_at IS NULL FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found' USING ERRCODE='42501'; END IF;
      UPDATE public.quotes SET title=_header->>'title', currency=_header->>'currency',
        tax_country_code=COALESCE(_header->>'tax_country_code',tax_country_code),
        tax_supply_type=COALESCE(_header->>'tax_supply_type',tax_supply_type),
        contact_id=(_header->>'contact_id')::uuid, company_id=(_header->>'company_id')::uuid,
        deal_id=(_header->>'deal_id')::uuid, valid_until=(_header->>'valid_until')::date,
        notes=_header->>'notes', terms=_header->>'terms'
      WHERE id=_id AND workspace_id=_workspace_id;
    ELSE
      INSERT INTO public.quotes(id,workspace_id,quote_number,title,currency,contact_id,company_id,deal_id,valid_until,notes,terms,tax_country_code,tax_supply_type)
      VALUES (_id,_workspace_id,_header->>'quote_number',_header->>'title',_header->>'currency',
        (_header->>'contact_id')::uuid,(_header->>'company_id')::uuid,(_header->>'deal_id')::uuid,
        (_header->>'valid_until')::date,_header->>'notes',_header->>'terms',
        _header->>'tax_country_code',_header->>'tax_supply_type');
    END IF;
    DELETE FROM public.quote_line_items WHERE quote_id=_id AND workspace_id=_workspace_id;
  ELSE
    IF _document_id IS NOT NULL THEN
      PERFORM 1 FROM public.invoices WHERE id=_id AND workspace_id=_workspace_id AND deleted_at IS NULL FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found' USING ERRCODE='42501'; END IF;
      UPDATE public.invoices SET currency=_header->>'currency',
        tax_country_code=COALESCE(_header->>'tax_country_code',tax_country_code),
        tax_supply_type=COALESCE(_header->>'tax_supply_type',tax_supply_type),
        contact_id=(_header->>'contact_id')::uuid, company_id=(_header->>'company_id')::uuid,
        deal_id=(_header->>'deal_id')::uuid, quote_id=(_header->>'quote_id')::uuid,
        issue_date=(_header->>'issue_date')::date, due_date=(_header->>'due_date')::date,
        notes=_header->>'notes', terms=_header->>'terms', external_ref=_header->>'external_ref',
        custom_fields=custom_fields || COALESCE(_header->'custom_fields','{}'::jsonb)
      WHERE id=_id AND workspace_id=_workspace_id;
    ELSE
      INSERT INTO public.invoices(id,workspace_id,invoice_number,currency,contact_id,company_id,deal_id,quote_id,issue_date,due_date,notes,terms,external_ref,custom_fields,tax_country_code,tax_supply_type)
      VALUES (_id,_workspace_id,_header->>'invoice_number',_header->>'currency',
        (_header->>'contact_id')::uuid,(_header->>'company_id')::uuid,(_header->>'deal_id')::uuid,(_header->>'quote_id')::uuid,
        (_header->>'issue_date')::date,(_header->>'due_date')::date,_header->>'notes',_header->>'terms',_header->>'external_ref',
        COALESCE(_header->'custom_fields','{}'::jsonb),
        _header->>'tax_country_code',_header->>'tax_supply_type');
    END IF;
    DELETE FROM public.invoice_line_items WHERE invoice_id=_id AND workspace_id=_workspace_id;
  END IF;
  -- No exception is swallowed: header changes, deletions, triggers and inserts
  -- roll back together if any line is invalid or any RLS check fails.
  FOR _line IN SELECT value FROM jsonb_array_elements(_lines) LOOP
    _reference := NULLIF(_line->>'product_id','')::uuid;
    IF _reference IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.products WHERE id=_reference AND workspace_id=_workspace_id) THEN
      RAISE EXCEPTION 'Product is outside the workspace' USING ERRCODE='42501';
    END IF;
    IF _kind='quote' THEN
      INSERT INTO public.quote_line_items(workspace_id,quote_id,product_id,name,description,quantity,unit_price,discount_pct,tax_rate,sort_order)
      VALUES (_workspace_id,_id,_reference,_line->>'name',_line->>'description',(_line->>'quantity')::numeric,
        (_line->>'unit_price')::numeric,(_line->>'discount_pct')::numeric,(_line->>'tax_rate')::numeric,_position);
    ELSE
      INSERT INTO public.invoice_line_items(workspace_id,invoice_id,product_id,name,description,quantity,unit_price,discount_pct,tax_rate,sort_order)
      VALUES (_workspace_id,_id,_reference,_line->>'name',_line->>'description',(_line->>'quantity')::numeric,
        (_line->>'unit_price')::numeric,(_line->>'discount_pct')::numeric,(_line->>'tax_rate')::numeric,_position);
    END IF;
    _position := _position+1;
  END LOOP;
  RETURN _id;
END;
$$;

-- Existing grants and RLS remain unchanged. This is a replacement of the
-- existing SECURITY INVOKER function with the same signature.
