-- Use the PDF version of a figure when rendering to PDF/LaTeX, the SVG version for HTML.
function Image(el)
  if FORMAT:match('latex') then
    el.src = el.src:gsub('%.svg$', '.pdf')
  end
  return el
end
