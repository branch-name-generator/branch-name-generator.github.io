#!/bin/sh
# Renders every icon and the Open Graph preview from the SVG sources.
# Runs inside the tooling container (see `just icons`).
set -eu

src=assets/icons
out=assets/icons

render() { # <svg> <size> <png>
  rsvg-convert -w "$2" -h "$2" "$1" -o "$3"
}

render $src/favicon.svg 16  $out/favicon-16.png
render $src/favicon.svg 32  $out/favicon-32.png
render $src/favicon.svg 48  $out/favicon-48.png
render $src/favicon.svg 180 apple-touch-icon.png
render $src/favicon.svg 192 $out/icon-192.png
render $src/favicon.svg 512 $out/icon-512.png
render $src/favicon-maskable.svg 512 $out/icon-maskable-512.png

# Multi-size .ico (16, 32, 48)
magick $out/favicon-16.png $out/favicon-32.png $out/favicon-48.png favicon.ico

# Open Graph / Twitter preview, 1200x630
rsvg-convert -w 1200 -h 630 $src/og-image.svg -o preview.png

rm $out/favicon-16.png $out/favicon-32.png $out/favicon-48.png
echo "icons generated"
