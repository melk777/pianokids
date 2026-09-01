create or replace function public.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  digits text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  total integer := 0;
  expected_digit integer;
begin
  if length(digits) <> 11
    or digits = repeat(substring(digits from 1 for 1), 11) then
    return false;
  end if;

  for index_position in 1..9 loop
    total := total + substring(digits from index_position for 1)::integer * (11 - index_position);
  end loop;
  expected_digit := (total * 10) % 11;
  if expected_digit = 10 then expected_digit := 0; end if;
  if expected_digit <> substring(digits from 10 for 1)::integer then return false; end if;

  total := 0;
  for index_position in 1..10 loop
    total := total + substring(digits from index_position for 1)::integer * (12 - index_position);
  end loop;
  expected_digit := (total * 10) % 11;
  if expected_digit = 10 then expected_digit := 0; end if;

  return expected_digit = substring(digits from 11 for 1)::integer;
end;
$$;

revoke execute on function public.is_valid_cpf(text) from public, anon, authenticated;
