<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        /* A4 portrait document rendering of an SOP's editor-authored content.
           Mirrors the certificate template's conventions: explicit font-family
           per block (KhmerOSmuol carries both Latin and Khmer glyphs), plain
           flow layout only — DomPDF supports a limited CSS subset (no
           flex/grid), so element styles below mirror what
           ui-core's RichTextContentViewer applies on screen. */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: KhmerOSmuol, DejaVu Sans, sans-serif;
            color: #1a1a2e;
            font-size: 12px;
            line-height: 1.6;
            padding: 36px 44px;
        }
        .doc-header { border-bottom: 2px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 20px; }
        .doc-header h1 { font-size: 20px; line-height: 1.3; }
        .meta-line { font-size: 10px; color: #4a4a6a; margin-top: 6px; }
        .meta-line strong { font-weight: bold; }
        .section-label {
            font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
            color: #888; margin: 18px 0 6px;
        }

        /* ── Authored content elements ─────────────────────────────────── */
        .content h1 { font-size: 17px; margin: 14px 0 6px; }
        .content h2 { font-size: 15px; margin: 12px 0 6px; }
        .content h3, .content h4 { font-size: 13px; margin: 10px 0 5px; }
        .content p { margin: 0 0 7px; }
        .content ul, .content ol { margin: 0 0 8px 22px; }
        .content ul { list-style: disc; }
        .content ol { list-style: decimal; }
        .content li { margin-bottom: 3px; }
        .content blockquote { border-left: 3px solid #bbb; padding-left: 10px; color: #555; margin: 8px 0; }
        .content pre {
            background: #f2f2f5; border: 1px solid #ddd; padding: 7px 9px;
            font-family: DejaVu Sans Mono, monospace; font-size: 11px;
            white-space: pre-wrap; margin: 8px 0;
        }
        .content code { background: #f2f2f5; padding: 0 3px; font-family: DejaVu Sans Mono, monospace; font-size: 11px; }
        .content pre code { background: none; padding: 0; }
        .content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        .content th, .content td { border: 1px solid #999; padding: 5px 7px; text-align: left; vertical-align: top; }
        .content th { background: #eee; font-weight: bold; }
        .content hr { border: none; border-top: 1px solid #ccc; margin: 14px 0; }
        .content a { color: #14538c; text-decoration: underline; }
        .content img { max-width: 100%; }
    </style>
</head>
<body>
    <div class="doc-header">
        <h1>{{ $title }}</h1>
        <div class="meta-line">
            v{{ $version }} &nbsp;·&nbsp;
            {{ $effectiveLabel }} &nbsp;·&nbsp;
            @if ($companyName)<strong>{{ $companyName }}</strong>@else{{ $scopeLabel }}@endif
        </div>
    </div>

    <div class="section-label">{{ $enLabel }}</div>
    <div class="content">{!! $contentEn !!}</div>

    @if ($contentKh)
        <div class="section-label">{{ $khLabel }}</div>
        <div class="content">{!! $contentKh !!}</div>
    @endif
</body>
</html>
