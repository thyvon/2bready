<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        /* Mirrors the blueprint's certificate layout (showCertificate). Font
           stack covers both engines: Gotenberg/Chrome resolves the fontconfig
           family name ('Khmer OS Muol'), DomPDF the registrar alias
           ('KhmerOSmuol') — one family carries Latin + Khmer glyphs. */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Khmer OS Muol', KhmerOSmuol, 'DejaVu Sans', sans-serif;
            color: #1a1a2e;
            padding: 34px 40px;
        }
        .cert-header { text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 18px; }
        .seal { font-size: 30px; margin-bottom: 4px; }
        h1 { font-size: 24px; letter-spacing: 1px; }
        h2 { font-size: 13px; color: #4a4a6a; margin-top: 4px; font-weight: normal; }
        .level-label { font-size: 11px; color: #888; margin-top: 6px; letter-spacing: 2px; text-transform: uppercase; }
        .cert-body { text-align: center; padding: 26px 12px 18px; }
        .field-label { font-size: 12px; font-weight: bold; letter-spacing: 1px; }
        .company-name-lg { font-size: 22px; font-weight: bold; margin: 8px 0 2px; }
        .company-name-kh { font-size: 13px; color: #4a4a6a; margin-bottom: 14px; }
        .meta-line { font-size: 12px; margin-top: 6px; }
        .meta-line strong { font-weight: bold; }
        .badge-display {
            display: inline-block; margin: 16px 0 8px; padding: 6px 18px;
            border-radius: 999px; font-size: 14px; font-weight: bold;
            color: #fff; background: #0f6e3d; letter-spacing: 1px;
        }
        .summary { max-width: 620px; margin: 0 auto; font-size: 11px; color: #4a4a6a; line-height: 1.5; }
        .achievement { margin-top: 10px; font-size: 11px; }
        .cert-footer {
            display: flex; justify-content: space-between; align-items: flex-end;
            border-top: 2px solid #1a1a2e; margin-top: 22px; padding-top: 12px;
        }
        .footer-stamp { font-size: 11px; line-height: 1.6; }
        .footer-stamp strong { font-size: 11px; }
        .verify-note { font-size: 10px; color: #4a4a6a; margin-top: 6px; }
        .qr { width: 88px; height: 88px; }
    </style>
</head>
<body>
    <div class="cert-header">
        <div class="seal">🏛️</div>
        <h1>2BREADY TRUST AUDIT CERTIFICATE</h1>
        <h2>វិញ្ញាបនបត្រ អនុគោមភាពសវនកម្មចំនួកចិត្ត 2bReady</h2>
        <div class="level-label">{{ $level }}</div>
    </div>

    <div class="cert-body">
        <div class="field-label">CERTIFIED ENTITY / សហគ្រាសទទួលបានវិញ្ញាបនបត្រ</div>
        <div class="company-name-lg">{{ $companyName }}</div>
        @if ($companyNameKh)
            <div class="company-name-kh">{{ $companyNameKh }}</div>
        @endif
        <div class="meta-line">DATE OF ISSUANCE / កាលបរិច្ឆេទចេញ: <strong>{{ $issuedAt->format('d M Y') }}</strong></div>
        <div class="meta-line">AUDIT ID / លេខយោងសវនកម្ម: <strong>{{ $auditId }}</strong></div>
        <div class="badge-display">{{ $level }} — Trust Badge</div>
        @if ($score !== null)
            <div class="summary">Compliance score: <strong>{{ $score }}/100</strong> — this entity has passed the {{ $level }} compliance audit.</div>
        @else
            <div class="summary">This entity has passed the {{ $level }} compliance audit.</div>
        @endif
    </div>

    <div class="cert-footer">
        <div class="footer-stamp">
            <div><strong>Verified by:</strong> {{ $stamp['verified_by'] }}</div>
            <div><strong>Approved by:</strong> {{ $stamp['approved_by'] }}</div>
            <div class="verify-note">🔐 {{ $stamp['prepared_by'] }}</div>
            <div class="verify-note">Verify at: {{ $verifyUrl }}</div>
        </div>
        <img class="qr" src="{{ $qrDataUri }}" alt="Verify QR">
    </div>
</body>
</html>
