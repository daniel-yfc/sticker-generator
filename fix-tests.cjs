const fs = require('fs');
const path = 'services/geminiService.test.ts';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
  /body: expect\.stringContaining\('generated-image-base64'\)/,
  "body: expect.stringContaining('Generate a high-quality die-cut sticker')"
);

content = content.replace(
  "vi.mocked(mockGenerateContent).mockClear();",
  ""
);

content = content.replace(
  "mockGenerateContent\n        .mockResolvedValueOnce",
  "global.fetch = vi.fn()\n        .mockResolvedValueOnce"
);

content = content.replace(
  /global\.fetch = vi\.fn\(\)\n\s*\.mockResolvedValueOnce\(\{\n\s*candidates: \[\{ finishReason: 'STOP', content: \{ parts: \[\{ inlineData: \{ data: 'batch-img-data' \} \}\] \} \}\]\n\s*\}\)\n\s*\.mockRejectedValueOnce\(new Error\('API Error'\)\);/,
  "global.fetch = vi.fn()\n        .mockResolvedValueOnce({\n          ok: true,\n          json: async () => ({\n            images: [\n              {\n                base64: 'batch-img-data',\n              },\n            ],\n          }),\n        } as any)\n        .mockResolvedValueOnce({\n          ok: false,\n          status: 500,\n          statusText: 'Internal Server Error',\n          json: async () => ({ error: { message: 'API Error' } }),\n          text: async () => 'API Error'\n        } as any);"
);

fs.writeFileSync(path, content);
