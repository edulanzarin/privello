/**
 * Página RSC — Política de Privacidade.
 *
 * Rota: `/politica-de-privacidade`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 86400` (24h — documento legal raramente muda).
 *
 * Documento canônico de privacidade da plataforma Privello, vinculado pelo
 * `<AgeGate>` (`src/components/age-gate.tsx`). Cobre LGPD (Lei 13.709/18),
 * bases legais, finalidades, compartilhamento com sub-processadores, direitos
 * do titular e retenção.
 *
 * Visual:
 * - Tahoe Sensual v2 via `<LegalShell>` + `<LegalSection>` (Inter Bold,
 *   tokens do design system, sem `font-serif`).
 * - Steering: `.kiro/steering/design-system.md` §4 (Inter only) + §5.1
 *   (reading archetype, container max-w-3xl).
 *
 * Notas:
 * - Conteúdo é template defensivo, não substitui consultoria jurídica.
 * - Sub-processadores listados refletem a stack atual: Mercado Pago,
 *   Cloudflare R2 + DNS, Railway (hospedagem + Postgres), Google SMTP.
 * - DPO: contato.privello@gmail.com (até DPO formal ser nomeado).
 */
import { LegalSection, LegalShell } from "@/components/layout/legal-shell";

export const revalidate = 86400; // 24h
export const metadata = {
    title: "Política de Privacidade · Privello",
    description: "Como o Privello coleta, usa e protege seus dados pessoais conforme a LGPD.",
};

const VERSION = "1.0";
const VIGENCIA = "17 de maio de 2026";

/**
 * Subtítulo h3 dentro de uma seção legal — usado em §2 para diferenciar
 * categorias de dados coletados sem quebrar a hierarquia editorial.
 */
function LegalSubheading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mt-6 mb-2 text-base font-semibold tracking-[-0.011em] text-ink">
            {children}
        </h3>
    );
}

export default function PoliticaDePrivacidadePage() {
    return (
        <LegalShell title="Política de Privacidade" version={VERSION} validFrom={VIGENCIA}>
            <LegalSection n="1" title="Quem somos">
                <p>
                    O <strong className="text-ink">Privello</strong> é uma plataforma digital operada por
                    pessoa física com sede em Blumenau-SC, Brasil, atuando como
                    controladora dos dados pessoais coletados nesta plataforma nos
                    termos da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/18).
                </p>
                <p>
                    Para questões de privacidade, exercício de direitos do titular ou
                    requerimentos da Autoridade Nacional de Proteção de Dados (ANPD),
                    entre em contato em{" "}
                    <a href="mailto:contato.privello@gmail.com" className="text-rose underline-offset-2 hover:underline">
                        contato.privello@gmail.com
                    </a>
                    .
                </p>
            </LegalSection>

            <LegalSection n="2" title="Dados que coletamos">
                <LegalSubheading>2.1. Dados de cadastro</LegalSubheading>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li><strong className="text-ink">Cliente:</strong> nome, e-mail, senha (hash bcrypt), avatar opcional, slug público.</li>
                    <li><strong className="text-ink">Provedor:</strong> nome, e-mail, senha (hash bcrypt), data de nascimento, cidade/bairro, telefone (WhatsApp opcional), foto de perfil, biografia, características físicas declaradas, valores cobrados, formas de pagamento aceitas, idiomas.</li>
                </ul>

                <LegalSubheading>2.2. Dados de verificação de identidade (provedor)</LegalSubheading>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Documento oficial com foto (RG, CNH ou Passaporte) — frente e verso;</li>
                    <li>Selfie segurando o documento;</li>
                    <li>Vídeo curto de prova de vida (opcional, conforme nível de verificação).</li>
                </ul>
                <p>
                    Estes dados têm <strong className="text-ink">tratamento restrito</strong> à equipe de
                    moderação e são armazenados em infraestrutura controlada
                    (Cloudflare R2). Não são exibidos publicamente em nenhuma hipótese.
                </p>

                <LegalSubheading>2.3. Dados de uso da plataforma</LegalSubheading>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Visualizações de perfis, favoritos, comentários e cliques em WhatsApp;</li>
                    <li>Logs de acesso (IP, user-agent, timestamps);</li>
                    <li>Uploads (mídias, áudios) postados pelos provedores em seus perfis;</li>
                    <li>Avaliações e comentários públicos.</li>
                </ul>

                <LegalSubheading>2.4. Dados de pagamento</LegalSubheading>
                <p>
                    Os dados de cartão de crédito ou meio de pagamento <strong className="text-ink">não são
                        coletados nem armazenados pelo Privello</strong>. O processamento é
                    feito integralmente pelo Mercado Pago. Recebemos apenas o status
                    (aprovado/recusado/pendente) e o identificador da transação para
                    confirmar a vigência da assinatura.
                </p>
            </LegalSection>

            <LegalSection n="3" title="Para que usamos seus dados">
                <ul className="ml-5 list-disc space-y-1.5">
                    <li><strong className="text-ink">Funcionamento da plataforma:</strong> autenticar você, exibir perfis, processar buscas, registrar interações.</li>
                    <li><strong className="text-ink">Verificação:</strong> confirmar identidade dos provedores e prevenir fraudes.</li>
                    <li><strong className="text-ink">Pagamentos:</strong> integrar com o Mercado Pago e gerenciar a vigência de assinaturas.</li>
                    <li><strong className="text-ink">Comunicações transacionais:</strong> enviar e-mails de confirmação de cadastro, recuperação de senha, recibos e avisos sobre a conta.</li>
                    <li><strong className="text-ink">Moderação:</strong> revisar conteúdo reportado e aplicar políticas de uso.</li>
                    <li><strong className="text-ink">Segurança:</strong> proteger a plataforma contra abuso, ataques, fraudes e bots.</li>
                    <li><strong className="text-ink">Métricas agregadas:</strong> melhorar o produto a partir de estatísticas anônimas (sem identificação pessoal).</li>
                    <li><strong className="text-ink">Cumprimento legal:</strong> atender requisições da Justiça e órgãos competentes quando legalmente exigido.</li>
                </ul>
            </LegalSection>

            <LegalSection n="4" title="Bases legais (LGPD art. 7º)">
                <ul className="ml-5 list-disc space-y-1.5">
                    <li><strong className="text-ink">Execução de contrato</strong> (art. 7º, V): cadastro, pagamento, fornecimento do espaço de visibilidade.</li>
                    <li><strong className="text-ink">Consentimento</strong> (art. 7º, I): envio de comunicações não transacionais, cookies não essenciais.</li>
                    <li><strong className="text-ink">Legítimo interesse</strong> (art. 7º, IX): segurança, prevenção a fraude, métricas agregadas.</li>
                    <li><strong className="text-ink">Cumprimento de obrigação legal</strong> (art. 7º, II): atendimento a ordens judiciais, retenção fiscal de comprovantes de pagamento.</li>
                    <li><strong className="text-ink">Proteção da vida</strong> (art. 7º, IV): em situações de risco a usuário ou a terceiros.</li>
                </ul>
            </LegalSection>

            <LegalSection n="5" title="Compartilhamento com terceiros">
                <p>
                    O Privello não vende dados pessoais. Compartilhamos dados estritamente
                    necessários com os seguintes <strong className="text-ink">operadores</strong> (na acepção da
                    LGPD), que processam dados em nosso nome sob acordos contratuais:
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li>
                        <strong className="text-ink">Mercado Pago</strong> (processamento de pagamentos):
                        e-mail, nome, identificador da transação. Sub-processador
                        principal de meios de pagamento.{" "}
                        <a className="text-rose underline-offset-2 hover:underline" href="https://www.mercadopago.com.br/ajuda/privacy" target="_blank" rel="noreferrer">
                            Política do Mercado Pago
                        </a>
                        .
                    </li>
                    <li>
                        <strong className="text-ink">Cloudflare R2</strong> (armazenamento de arquivos): fotos,
                        vídeos, áudios e documentos de verificação. Servidores na zona
                        Eastern North America (ENAM). Sob a Cloudflare DPA e cláusulas
                        contratuais padrão para transferência internacional.
                    </li>
                    <li>
                        <strong className="text-ink">Cloudflare</strong> (DNS e CDN): logs de acesso (IP,
                        user-agent), tráfego HTTP. Mesmos termos da Cloudflare DPA.
                    </li>
                    <li>
                        <strong className="text-ink">Railway</strong> (hospedagem da aplicação e banco
                        Postgres): processa todos os dados da aplicação em servidor
                        único na zona US East. Sob a Railway DPA.
                    </li>
                    <li>
                        <strong className="text-ink">Google LLC (Gmail SMTP)</strong> (envio de e-mails
                        transacionais): apenas o e-mail do destinatário e o conteúdo da
                        mensagem.
                    </li>
                </ul>
                <p>
                    Em nenhum caso compartilhamos seus dados com fins publicitários,
                    de marketing por terceiros ou venda de listas.
                </p>
            </LegalSection>

            <LegalSection n="6" title="Seus direitos (LGPD art. 18)">
                <p>
                    Você pode, a qualquer momento, exercer os seguintes direitos sobre
                    os seus dados pessoais, mediante solicitação por e-mail
                    (resposta em até 15 dias):
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li><strong className="text-ink">Confirmação e acesso:</strong> saber se tratamos dados sobre você e receber uma cópia.</li>
                    <li><strong className="text-ink">Correção:</strong> atualizar dados incompletos, inexatos ou desatualizados.</li>
                    <li><strong className="text-ink">Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.</li>
                    <li><strong className="text-ink">Portabilidade:</strong> receber seus dados em formato estruturado para enviar a outro fornecedor.</li>
                    <li><strong className="text-ink">Eliminação dos dados</strong> tratados sob consentimento.</li>
                    <li><strong className="text-ink">Informação sobre compartilhamento</strong> com órgãos públicos ou privados.</li>
                    <li><strong className="text-ink">Revogação do consentimento</strong>, quando for a base legal aplicável.</li>
                    <li><strong className="text-ink">Oposição</strong> a tratamento em desacordo com a LGPD.</li>
                </ul>
                <p>
                    Solicitações em{" "}
                    <a href="mailto:contato.privello@gmail.com" className="text-rose underline-offset-2 hover:underline">
                        contato.privello@gmail.com
                    </a>
                    . Confirmaremos sua identidade antes de processar requisições para
                    evitar acesso indevido por terceiros.
                </p>
            </LegalSection>

            <LegalSection n="7" title="Retenção de dados">
                <p>
                    Mantemos seus dados pelo tempo necessário às finalidades descritas
                    ou conforme exigido por lei.
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li><strong className="text-ink">Conta ativa:</strong> enquanto a conta existir.</li>
                    <li><strong className="text-ink">Conta inativa (perfil sem renovação):</strong> mantida em estado oculto por até 12 meses para permitir reativação rápida.</li>
                    <li><strong className="text-ink">Conta encerrada por solicitação:</strong> dados pessoais identificáveis são deletados em até 30 dias, exceto registros mínimos exigidos por lei (notas fiscais, comprovantes de pagamento — retenção de 5 anos por exigência fiscal).</li>
                    <li><strong className="text-ink">Mídias enviadas (fotos, vídeos, áudios) e documentos de verificação:</strong> permanecem armazenados em infraestrutura segura mesmo após desativação do perfil, em conformidade com retenção de evidências para auditoria, requisições legais e prevenção de fraude. A exclusão definitiva pode ser solicitada conforme art. 18 da LGPD.</li>
                    <li><strong className="text-ink">Logs de segurança:</strong> 12 meses.</li>
                    <li><strong className="text-ink">Comunicações transacionais (e-mails enviados):</strong> 24 meses.</li>
                </ul>
            </LegalSection>

            <LegalSection n="8" title="Segurança">
                <p>
                    Adotamos medidas técnicas e administrativas para proteger seus
                    dados, incluindo:
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li>HTTPS/TLS em todo o tráfego (HSTS habilitado);</li>
                    <li>Senhas armazenadas com hash bcrypt (cost 12);</li>
                    <li>Tokens de sessão criptograficamente fortes;</li>
                    <li>Controles de acesso restritos no painel administrativo;</li>
                    <li>Rate limiting nos pontos críticos (login, upload, comentários);</li>
                    <li>CSP, HSTS, headers de segurança configurados conforme as melhores práticas;</li>
                    <li>Hospedagem em provedores com certificações ISO 27001 e SOC 2 (Cloudflare, Railway).</li>
                </ul>
                <p>
                    Apesar destas medidas, nenhum sistema é 100% imune a ataques. Em caso
                    de incidente que envolva risco relevante aos titulares, comunicaremos
                    os afetados e a ANPD nos prazos da LGPD (art. 48).
                </p>
            </LegalSection>

            <LegalSection n="9" title="Cookies e armazenamento local">
                <p>
                    Utilizamos cookies e armazenamento local do navegador (localStorage,
                    sessionStorage) apenas para finalidades essenciais:
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Sessão autenticada (NextAuth);</li>
                    <li>Confirmação de idade (+18) para não exibir o aviso a cada visita;</li>
                    <li>Preferências de interface (tema, idioma quando aplicável).</li>
                </ul>
                <p>
                    Não usamos cookies publicitários, de remarketing ou trackers de
                    terceiros. Você pode bloquear cookies pelas configurações do
                    navegador, mas isto pode quebrar funcionalidades como login.
                </p>
            </LegalSection>

            <LegalSection n="10" title="Transferência internacional de dados">
                <p>
                    Alguns dos nossos sub-processadores (Cloudflare, Railway, Google)
                    mantêm servidores fora do Brasil, principalmente nos Estados
                    Unidos. Estas transferências ocorrem mediante:
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                    <li>Cláusulas contratuais padrão de proteção de dados;</li>
                    <li>Compromisso de aplicação de padrões equivalentes ou superiores aos da LGPD pelos sub-processadores;</li>
                    <li>Quando aplicável, certificações reconhecidas internacionalmente (Privacy Shield/Trans-Atlantic Data Privacy Framework, quando vigente).</li>
                </ul>
            </LegalSection>

            <LegalSection n="11" title="Crianças e adolescentes">
                <p>
                    O Privello é destinado <strong className="text-ink">exclusivamente a maiores de 18
                        anos</strong>. Não coletamos dados intencionalmente de menores.
                    Se identificarmos dados de menor de idade, a conta será removida
                    imediatamente. Se você tem conhecimento de uso por menor, reporte
                    urgentemente em{" "}
                    <a href="mailto:contato.privello@gmail.com" className="text-rose underline-offset-2 hover:underline">
                        contato.privello@gmail.com
                    </a>
                    .
                </p>
            </LegalSection>

            <LegalSection n="12" title="Alterações desta política">
                <p>
                    Esta Política pode ser atualizada periodicamente. Alterações
                    substanciais serão comunicadas com pelo menos{" "}
                    <strong className="text-ink">30 dias de antecedência</strong> por e-mail e por aviso na
                    plataforma. A versão vigente está sempre acessível nesta página com
                    a data de vigência atualizada no topo.
                </p>
            </LegalSection>

            <LegalSection n="13" title="Encarregado / DPO">
                <p>
                    Até a indicação de Encarregado formal, o canal de contato para
                    assuntos de proteção de dados é{" "}
                    <a href="mailto:contato.privello@gmail.com" className="text-rose underline-offset-2 hover:underline">
                        contato.privello@gmail.com
                    </a>
                    . Você também pode procurar diretamente a Autoridade Nacional de
                    Proteção de Dados (ANPD) em{" "}
                    <a className="text-rose underline-offset-2 hover:underline" href="https://www.gov.br/anpd" target="_blank" rel="noreferrer">
                        gov.br/anpd
                    </a>
                    .
                </p>
            </LegalSection>
        </LegalShell>
    );
}
