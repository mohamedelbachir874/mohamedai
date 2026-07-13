#!/bin/bash
# Create a clean zip archive of the Mohamed AI project
# Excludes: node_modules, .next, db, .env, logs, upload, skills, .git

set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_ZIP="/home/z/my-project/download/mohamed-ai.zip"

cd "$PROJECT_DIR"

# Remove old zip if exists
rm -f "$OUTPUT_ZIP"

# Create zip with exclusions
zip -r "$OUTPUT_ZIP" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "db/*" \
  -x ".env" \
  -x "dev.log" \
  -x "server.log" \
  -x "dev.out.log" \
  -x "*.log" \
  -x "upload/*" \
  -x "skills/*" \
  -x ".git/*" \
  -x ".zscripts/*" \
  -x ".z-ai-config" \
  -x "download/*" \
  -x "mini-services/*" \
  -x "examples/*" \
  -x "tsconfig.tsbuildinfo" \
  -x ".DS_Store" \
  2>/dev/null

# Show result
echo "✅ تم إنشاء الأرشيف بنجاح!"
echo "📁 المسار: $OUTPUT_ZIP"
echo "📊 الحجم: $(du -h "$OUTPUT_ZIP" | cut -f1)"
echo ""
echo "📋 محتويات الأرشيف:"
unzip -l "$OUTPUT_ZIP" | tail -20
