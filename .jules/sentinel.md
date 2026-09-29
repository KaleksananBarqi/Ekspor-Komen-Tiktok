## 2024-05-15 - CSV Injection Vulnerability Fix
**Vulnerability:** Found a CSV Injection (Formula Injection) vulnerability in `content.js` when exporting TikTok comments to a CSV file. Usernames, comments, and times from TikTok are untrusted inputs, which can start with characters like `=`, `+`, `-`, `@`, `\t`, or `\r`. If opened in a spreadsheet program, this can lead to malicious formula execution.
**Learning:** The CSV data formatting did not correctly sanitize characters that can be evaluated as formulas when parsed by applications such as Microsoft Excel, Google Sheets, or LibreOffice Calc.
**Prevention:** Always prepend a single quote (`'`) to strings that start with `=`, `+`, `-`, `@`, `\t`, or `\r` before writing to a CSV file.
