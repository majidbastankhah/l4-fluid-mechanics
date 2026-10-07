--[[
problems-print.lua: turns the problem bank into printable PDFs (used by problems/problem-bank-*.qmd).
  metadata  problem-solutions: true   -> each problem is followed by its Hint, Final answer and Full solution
            problem-solutions: false  -> problems only
  * the <details> toggles become bold run-in headings (or are dropped);
  * "done" ticks and HTML comments are dropped;
  * links into the website (../notes/ch2.qmd#sec-x) become full web addresses;
  * headings: chapter -> section, topic -> subsection, problem -> subsubsection.
--]]
if not FORMAT:match("latex") then return {} end

local SITE = "https://majidbastankhah.github.io/l4-fluid-mechanics/"
local with_solutions = false
local LABEL = { hint = "Hint", answer = "Final answer", full = "Full solution" }

local function kind_of(b)
  if b.t ~= "RawBlock" or not b.format:match("html") then return nil end
  return b.text:match('^%s*<details%s+class="(%a+)"')
end
local function is_close(b)
  return b.t == "RawBlock" and b.format:match("html") and b.text:match("</details>")
end

local function has_raw(b, pat)
  if b.t ~= "Plain" and b.t ~= "Para" then return false end
  local found = false
  pandoc.walk_block(b, { RawInline = function(r) if r.format:match("html") and r.text:match(pat) then found = true end end })
  return found
end

local function fix_inlines(el)
  return el:walk({
    Str = function(s)
      if s.text:find("★") then
        local out, rest = pandoc.List(), s.text
        for part, star in rest:gmatch("([^★]*)(★?)") do
          if part ~= "" then out:insert(pandoc.Str(part)) end
          if star ~= "" then out:insert(pandoc.RawInline("latex", "$\\star$")) end
        end
        return out
      end
    end,
    Link = function(l)
      local t = l.target
      if t:match("^%.%./") then
        t = t:gsub("^%.%./", ""):gsub("%.qmd", ".html")
        l.target = SITE .. t
      elseif t:match("^#") then
        l.target = SITE .. "problems/index.html" .. t
      end
      return l
    end,
    RawInline = function(r) if r.format:match("html") then return {} end end,
  })
end

local function process(blocks, in_problem)
  local out, i = pandoc.List(), 1
  while i <= #blocks do
    local b = blocks[i]
    local kind = kind_of(b)
    if kind then
      local inner, j = pandoc.List(), i + 1
      local in_summary = false                       -- drop the toggle's own label (<summary>...</summary>)
      while j <= #blocks and not is_close(blocks[j]) do
        local c = blocks[j]
        local raw = c.t == "RawBlock" and c.format:match("html") and c.text or ""
        if raw:match("<summary") then in_summary = not raw:match("</summary>")
        elseif raw:match("</summary>") then in_summary = false
        elseif not in_summary and not has_raw(c, "<summary") then inner:insert(c) end
        j = j + 1
      end
      if with_solutions then
        out:insert(pandoc.RawBlock("latex", "\\par\\medskip\\noindent\\textbf{" .. (LABEL[kind] or kind) .. "}\\par\\nopagebreak"))
        out:extend(process(inner, in_problem))
      end
      i = j + 1
    elseif (b.t == "RawBlock" and b.format:match("html")) or has_raw(b, "<label") then
      i = i + 1                                   -- done ticks, comments
    elseif b.t == "Div" and b.classes:includes("problem") then
      out:insert(pandoc.RawBlock("latex", "\\bigskip\\noindent\\rule{\\linewidth}{0.4pt}\\par"))
      out:extend(process(b.content, true))
      i = i + 1
    elseif b.t == "Div" then
      b.content = process(b.content, in_problem); out:insert(b); i = i + 1
    elseif b.t == "Header" then
      if in_problem then b.level = 3 else b.level = math.max(1, b.level - 1) end
      out:insert(fix_inlines(b)); i = i + 1
    else
      out:insert(fix_inlines(b)); i = i + 1
    end
  end
  return out
end

function Pandoc(doc)
  local v = doc.meta["problem-solutions"]
  with_solutions = (v == true) or (type(v) == "table" and pandoc.utils.stringify(v) == "true")
  doc.blocks = process(doc.blocks, false)
  return doc
end
