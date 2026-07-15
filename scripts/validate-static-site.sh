#!/bin/sh
set -eu

required_files="
public/index.html
public/assets/css/app.css
public/assets/icons/favicon-calculator-100.png
public/assets/js/app.js
public/assets/js/core/addressing-modes.js
public/assets/js/core/allocator.js
public/assets/js/core/cidr.js
public/assets/js/core/ipv4.js
public/assets/js/core/route-summarization.js
public/assets/js/core/validation.js
public/assets/js/ui/storage.js
"

for file in $required_files; do
  if [ ! -f "$file" ]; then
    echo "Missing required static file: $file" >&2
    exit 1
  fi
done

for file in $(find public/assets/js -name '*.js' -type f); do
  node --check "$file"
done

node scripts/validate-static-site.mjs

echo "Static application structure and JavaScript syntax are valid."
