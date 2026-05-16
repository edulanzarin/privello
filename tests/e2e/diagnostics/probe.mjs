// One-shot probe: fetch a few pages and report whether the DOM/Tailwind classes
// the test selectors look for are actually in the SSR output.
const targets = [
    { url: "http://192.168.1.96:3000/", needles: ["h-[62px]", "z-[100]", "rounded-full p-[3px]", "scrollbar-hide"] },
    { url: "http://192.168.1.96:3000/descobrir/sao-paulo-sp", needles: ["h-[62px]", "z-[100]", "rounded-full p-[3px]"] },
    { url: "http://192.168.1.96:3000/buscar", needles: ["Cidade", "Trocar cidade", "Ex: São Paulo"] },
    { url: "http://192.168.1.96:3000/p/helena", needles: ["Compartilhar perfil", "Compartilhar"] },
    { url: "http://192.168.1.96:3000/reels/helena", needles: ["message-circle", "rounded-t-2xl", "MessageCircle"] },
];

for (const t of targets) {
    try {
        const r = await fetch(t.url, { redirect: "manual" });
        const text = await r.text();
        console.log(`\n=== ${t.url} → ${r.status} (len ${text.length})`);
        for (const n of t.needles) {
            const idx = text.indexOf(n);
            console.log(`  [${idx >= 0 ? "OK" : "MISS"}] ${n}${idx >= 0 ? ` @${idx}` : ""}`);
        }
    } catch (e) {
        console.log(`\n=== ${t.url} → ERROR: ${e.message}`);
    }
}
