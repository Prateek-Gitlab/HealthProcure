#!/bin/bash
MAPFILE="$1"
original_message=$(cat)
hash=$(git rev-parse --short HEAD)
new_message=$(grep "^$hash " "$MAPFILE" | cut -d' ' -f2-)
if [ -n "$new_message" ]; then
    echo "$new_message"
else
    echo "$original_message"
fi
