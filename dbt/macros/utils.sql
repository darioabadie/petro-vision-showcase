{% macro slugify(expr) %}
lower(replaceRegexpAll(trim(both '-' from replaceRegexpAll(trim(lower({{ expr }})), '[^a-z0-9]+', '-')), '-+', '-'))
{% endmacro %}

{% macro pvm_cutoff_date() %}
toDate({{ "'" ~ var('pvm_cutoff') ~ "'" }})
{% endmacro %}