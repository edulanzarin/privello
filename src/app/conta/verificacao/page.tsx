/**
 * Redirect — `/conta/verificacao` → `/painel/verificacao`.
 *
 * A página foi movida em 2026-05-18 para dentro de `/painel/**` para herdar
 * o shell `<PainelLayout>` (sidebar com hamburger, BottomNav escondida — não
 * havia chrome contextual antes).
 *
 * Mantemos esse redirect 308 (permanente) para preservar:
 *  - Links em emails de moderação que possam ter linkado a URL antiga.
 *  - Bookmarks de providers que estavam com a URL salva.
 *  - O `revalidatePath` do server action que ainda referencia este caminho —
 *    o redirect garante que a invalidação chegue na rota nova quando o user
 *    voltar.
 */
import { redirect, RedirectType } from "next/navigation";

export default function ContaVerificacaoRedirect() {
  redirect("/painel/verificacao", RedirectType.replace);
}
