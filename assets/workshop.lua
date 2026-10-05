--[[
workshop.lua — turns the workshop pages into "try first, then reveal" pages, and builds the
printable student handout (PDF) from the same source. Applied to every page in workshops/
(see workshops/_metadata.yml).

Source conventions (unchanged from before):
  <details class="answer"><summary>Show step</summary>   ...worked solution...   </details>
  [answer]{.gap}      an inline blank in a prompt, table or checklist

HTML (website)
  * every blank becomes an empty line ____ in the prompt;
  * a block (paragraph, list, table) that contains blanks is followed by a solution box
    holding the same block with the blanks filled in (merged into the next solution box
    if one follows directly);
  * before every solution box a writing pad is inserted (stylus/mouse, with an optional text box;
    kept in the student's own browser); summaries read "Show solution". The confirmation step
    ("Have you tried it yourself?") is added by assets/widgets/workshops.js.
PDF (printable handout)
  * blanks become write-on lines; solution boxes are replaced by empty space to write in,
    sized roughly by the length of the solution.
--]]

local is_html = FORMAT:match("html") ~= nil
local is_latex = FORMAT:match("latex") ~= nil

local function has_gap(block)
  local found = false
  pandoc.walk_block(block, { Span = function(s) if s.classes:includes("gap") then found = true end end })
  return found
end

local function blank_version(block)
  return pandoc.walk_block(block, {
    Span = function(s)
      if s.classes:includes("gap") then
        if is_latex then return pandoc.RawInline("latex", "\\underline{\\hspace{2.2cm}}") end
        return pandoc.RawInline("html", '<span class="blank" aria-label="blank"></span>')
      end
    end
  })
end

local function filled_version(block)
  return pandoc.walk_block(block, {
    Span = function(s)
      if s.classes:includes("gap") then return pandoc.Span(s.content, pandoc.Attr("", { "filled" })) end
    end
  })
end

local function attempt_box(chars)
  -- writing pad built by assets/widgets/workshops.js; height (in px at 800 px width) grows
  -- with the length of the solution, so longer steps get more room to write
  local h = math.floor(math.max(320, math.min(1000, 220 + 0.6 * (chars or 0))))
  return pandoc.RawBlock("html", string.format('<div class="ws-attempt" data-h="%d"></div>', h))
end

local OPEN = '<details class="answer"><summary>Show solution</summary>'

local function is_open(b)  return b.t == "RawBlock" and b.format:match("html") and b.text:match('<details%s+class="answer"') end
local function count(raw, pat) return select(2, raw:gsub(pat, "")) end

local function words(blocks)
  local n = 0
  for _, b in ipairs(blocks) do n = n + #pandoc.utils.stringify(b) end
  return n
end

local function writing_space(chars)
  -- ~ 1 cm of space per 120 characters of solution, between 2.5 cm and 9 cm
  local cm = math.max(2.5, math.min(9, 1.5 + chars / 120))
  return pandoc.RawBlock("latex", string.format(
    "\\par\\noindent\\fbox{\\begin{minipage}[t][%.1fcm]{\\dimexpr\\linewidth-2\\fboxsep-2\\fboxrule\\relax}" ..
    "\\mbox{}\\end{minipage}}\\par\\medskip", cm))  -- \\mbox{} keeps the empty box at full height
end

local process -- forward declaration

-- process one list of blocks (top-down, so a list/table with blanks is treated as one unit)
process = function(blocks)
  local out = pandoc.List()
  local i = 1
  while i <= #blocks do
    local b = blocks[i]
    if is_open(b) then
      -- collect the whole <details class="answer"> … </details> region
      local depth = count(b.text, "<details") - count(b.text, "</details>")
      local inner = pandoc.List()
      local j = i + 1
      while j <= #blocks and depth > 0 do
        local c = blocks[j]
        if c.t == "RawBlock" and c.format:match("html") then
          depth = depth + count(c.text, "<details") - count(c.text, "</details>")
          if depth > 0 then inner:insert(c) end
        else
          inner:insert(c)
        end
        j = j + 1
      end
      if is_latex then
        out:insert(writing_space(words(inner)))
      else
        out:insert(attempt_box(words(inner)))
        out:insert(pandoc.RawBlock("html", OPEN))
        out:extend(inner)
        out:insert(pandoc.RawBlock("html", "</details>"))
      end
      i = j
    elseif b.t == "Div" then
      b.content = process(b.content)
      out:insert(b)
      i = i + 1
    elseif has_gap(b) then
      out:insert(blank_version(b))
      if is_latex then
        i = i + 1
      else
        local nxt = blocks[i + 1]
        if nxt and is_open(nxt) then
          -- merge the filled-in block into the solution box that follows
          local filled = filled_version(b)
          local rest = process(pandoc.List({ table.unpack(blocks, i + 1) }))
          -- rest starts with: attempt box, OPEN, ...; insert the filled block right after OPEN
          out:insert(rest[1]); out:insert(rest[2]); out:insert(filled)
          for k = 3, #rest do out:insert(rest[k]) end
          return out
        else
          out:insert(attempt_box(#pandoc.utils.stringify(b)))
          out:insert(pandoc.RawBlock("html", OPEN))
          out:insert(filled_version(b))
          out:insert(pandoc.RawBlock("html", "</details>"))
        end
        i = i + 1
      end
    else
      out:insert(b)
      i = i + 1
    end
  end
  return out
end

function Pandoc(doc)
  if not (is_html or is_latex) then return doc end
  doc.blocks = process(doc.blocks)
  return doc
end
