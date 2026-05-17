/**
 * Página RSC — Termos de Uso.
 *
 * Rota: `/termos-de-uso`.
 * Tipo: Server Component.
 * Auth: público.
 * Cache: `revalidate = 86400` (24h — documento legal raramente muda).
 *
 * Documento canônico de termos da plataforma Privello, vinculado pelo
 * `<AgeGate>` (`src/components/age-gate.tsx`) e pelo footer do site público.
 *
 * Notas:
 * - Conteúdo é template defensivo, não substitui consultoria jurídica
 *   especializada antes do go-live com tráfego real.
 * - Posicionamento explícito: plataforma de visibilidade/diretório, não
 *   intermedia, presta nem garante serviços anunciados pelos provedores.
 *   Defendido em `.kiro/specs/migracao-infra-producao` e na conversa de
 *   compliance com o Mercado Pago.
 * - Foro: Blumenau-SC (operador pessoa física, definido pelo proprietário).
 */
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const revalidate = 86400; // 24h
export const metadata = {
    title: "Termos de Uso · Privello",
    description: "Termos de Uso da plataforma Privello — diretório de visibilidade para profissionais autônomos.",
};

const VERSION = "1.0";
const VIGENCIA = "17 de maio de 2026";

export default function TermosDeUsoPage() {
    return (
        <>
            <SiteHeader />
            <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
                <h1 className="font-serif text-4xl">Termos de Uso</h1>
                <p className="mt-2 text-xs uppercase tracking-wide text-muted">
                    Versão {VERSION} · vigência a partir de {VIGENCIA}
                </p>

                <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
                    <Section n="1" title="Aceitação dos termos">
                        <p>
                            Ao acessar ou utilizar a plataforma Privello (o &quot;Serviço&quot;),
                            disponibilizada em <code>privello.com.br</code> e endereços associados,
                            você declara ter lido, compreendido e concordado integralmente com
                            estes Termos de Uso e com a Política de Privacidade. Se você não
                            concorda, não utilize o Serviço.
                        </p>
                        <p>
                            Você declara ter <strong>18 anos completos ou mais</strong>, ser
                            plenamente capaz nos termos da legislação brasileira e responsável
                            pelas próprias ações ao usar o Serviço.
                        </p>
                    </Section>

                    <Section n="2" title="O que é o Privello">
                        <p>
                            O Privello é uma <strong>plataforma digital de visibilidade</strong>
                            que oferece a profissionais autônomos maiores de idade um diretório
                            online onde podem manter um perfil público, exibir mídias, divulgar
                            seus contatos e ser encontrados por visitantes.
                        </p>
                        <p>
                            <strong>O Privello NÃO intermedia, presta, contrata, supervisiona,
                                garante ou cobra por serviços anunciados pelos profissionais
                                cadastrados.</strong> A plataforma cobra apenas a assinatura mensal
                            do espaço de visibilidade. Toda interação, contratação, negociação,
                            pagamento e prestação de serviço entre visitantes e profissionais é
                            estritamente bilateral, sem participação ou responsabilidade do Privello.
                        </p>
                    </Section>

                    <Section n="3" title="Cadastro e contas">
                        <p>
                            <strong>Cliente (visitante).</strong> Acesso de leitura ao diretório
                            é livre. Funções como favoritos, comentários e contato direto exigem
                            cadastro com e-mail válido e aceitação destes Termos.
                        </p>
                        <p>
                            <strong>Provedor (profissional).</strong> Para criar um perfil
                            público, o provedor deve completar o onboarding, fornecer dados
                            verídicos, enviar fotos/áudios próprios e submeter documentos de
                            identidade para verificação. O cadastro só é concluído após
                            confirmação do pagamento da assinatura via Mercado Pago.
                        </p>
                        <p>
                            <strong>Veracidade das informações.</strong> Você é integralmente
                            responsável pela exatidão dos dados que fornece. Cadastros
                            fraudulentos, com dados de terceiros sem autorização ou de menores de
                            idade são proibidos e configuram crime conforme a legislação
                            brasileira.
                        </p>
                        <p>
                            <strong>Segurança da conta.</strong> Você é responsável pela guarda
                            das suas credenciais. Notifique-nos imediatamente em caso de suspeita
                            de uso não autorizado por meio de <a href="mailto:contato.privello@gmail.com" className="underline">contato.privello@gmail.com</a>.
                        </p>
                    </Section>

                    <Section n="4" title="Pagamentos e assinatura">
                        <p>
                            A assinatura do plano de visibilidade é processada exclusivamente
                            pelo <strong>Mercado Pago</strong>. O Privello não armazena dados de
                            cartão de crédito.
                        </p>
                        <p>
                            <strong>Vigência.</strong> O plano contratado é válido por 30 dias
                            corridos a partir da confirmação do pagamento. A renovação requer
                            novo pagamento — não há cobrança recorrente automática nesta fase.
                        </p>
                        <p>
                            <strong>Reembolso.</strong> O direito de arrependimento de 7 dias do
                            CDC (art. 49) aplica-se à primeira contratação realizada inteiramente
                            online. Solicitações devem ser feitas por escrito a <a href="mailto:contato.privello@gmail.com" className="underline">contato.privello@gmail.com</a> dentro do prazo. Após o
                            uso efetivo do espaço de visibilidade (publicação do perfil),
                            considera-se serviço prestado.
                        </p>
                        <p>
                            <strong>Inadimplência.</strong> Não havendo renovação, o perfil é
                            ocultado do diretório público e os dados ficam preservados em conta
                            inativa por até 12 meses, conforme política de retenção descrita na
                            Política de Privacidade.
                        </p>
                    </Section>

                    <Section n="5" title="Conteúdo enviado por usuários">
                        <p>
                            Ao enviar fotos, vídeos, áudios ou textos, você declara ser o titular
                            dos direitos autorais e/ou ter autorização expressa de todas as
                            pessoas retratadas, e concede ao Privello uma <strong>licença não
                                exclusiva, gratuita, mundial e revogável</strong> para hospedar e
                            exibir o conteúdo dentro da plataforma.
                        </p>
                        <p>
                            Esta licença é estritamente limitada ao funcionamento do Serviço; o
                            Privello não revende, sublicencia nem cede o conteúdo a terceiros
                            sem sua autorização. A licença permanece válida enquanto o conteúdo
                            estiver publicado.
                        </p>
                        <p>
                            <strong>Conteúdo proibido.</strong> É vedado publicar:
                        </p>
                        <ul className="ml-5 list-disc space-y-1">
                            <li>Conteúdo que envolva menores de 18 anos em qualquer contexto sensual ou de nudez;</li>
                            <li>Conteúdo de terceiros sem autorização (vingança, exposição não consentida);</li>
                            <li>Material de tráfico humano, exploração sexual ou violência;</li>
                            <li>Conteúdo que viole direitos autorais ou marca registrada;</li>
                            <li>Material criminoso, fraudulento ou que incite ódio;</li>
                            <li>Discursos discriminatórios por raça, gênero, orientação sexual, religião, origem ou deficiência.</li>
                        </ul>
                    </Section>

                    <Section n="6" title="Conduta proibida">
                        <p>É proibido ao usar o Privello:</p>
                        <ul className="ml-5 list-disc space-y-1">
                            <li>Criar contas múltiplas, falsas ou em nome de terceiros;</li>
                            <li>Fazer engenharia reversa, scraping em massa ou tentar comprometer a infraestrutura;</li>
                            <li>Tentar burlar mecanismos de pagamento, verificação ou rate limiting;</li>
                            <li>Enviar spam, mensagens em massa ou se passar pela equipe Privello;</li>
                            <li>Usar a plataforma para fraudes, lavagem de dinheiro ou qualquer atividade ilícita;</li>
                            <li>Coletar dados de outros usuários sem autorização.</li>
                        </ul>
                    </Section>

                    <Section n="7" title="Verificação de identidade">
                        <p>
                            Para garantir a autenticidade dos perfis e prevenir fraudes, o
                            Privello realiza um processo de verificação que pode incluir o envio
                            de documentos oficiais (RG, CNH ou Passaporte) e selfies. Os documentos
                            são analisados pela equipe de moderação e armazenados de forma segura
                            conforme descrito na Política de Privacidade.
                        </p>
                        <p>
                            A verificação é condição para a obtenção do selo de
                            &quot;perfil verificado&quot; mas não é garantia absoluta de
                            identidade. Cadastros suspeitos podem ter o selo revogado e o perfil
                            suspenso a critério da equipe.
                        </p>
                    </Section>

                    <Section n="8" title="Suspensão e encerramento">
                        <p>
                            O Privello pode suspender ou encerrar contas que violem estes Termos,
                            a Política de Privacidade ou a legislação aplicável,
                            <strong> com ou sem aviso prévio</strong>, especialmente em casos de:
                        </p>
                        <ul className="ml-5 list-disc space-y-1">
                            <li>Suspeita ou confirmação de fraude, atividade ilegal ou conteúdo proibido;</li>
                            <li>Inadimplência por mais de 60 dias;</li>
                            <li>Múltiplas reclamações fundamentadas de outros usuários;</li>
                            <li>Risco à integridade da plataforma ou de outros usuários.</li>
                        </ul>
                        <p>
                            Em caso de suspensão, você pode contestar por meio do canal de
                            suporte. Em caso de encerramento por violação grave, não há
                            reembolso e os dados são tratados conforme a Política de Privacidade.
                        </p>
                        <p>
                            Você pode encerrar sua conta a qualquer momento entrando em contato
                            por <a href="mailto:contato.privello@gmail.com" className="underline">contato.privello@gmail.com</a>.
                        </p>
                    </Section>

                    <Section n="9" title="Propriedade intelectual">
                        <p>
                            A marca Privello, o logotipo, a interface, o código-fonte, os
                            textos editoriais e os elementos visuais da plataforma são
                            propriedade do operador e protegidos pela Lei nº 9.279/96 (marcas) e
                            pela Lei nº 9.610/98 (direitos autorais). Reprodução, redistribuição
                            ou uso não autorizado é vedado.
                        </p>
                    </Section>

                    <Section n="10" title="Limitação de responsabilidade">
                        <p>
                            O Privello fornece o Serviço &quot;no estado em que se encontra&quot;,
                            sem garantias de disponibilidade ininterrupta, ausência total de
                            erros ou adequação a finalidade específica.
                        </p>
                        <p>
                            Na máxima extensão permitida pela lei, o Privello, seus operadores e
                            colaboradores não serão responsáveis por:
                        </p>
                        <ul className="ml-5 list-disc space-y-1">
                            <li>Conduta, mensagens, mídias ou serviços de terceiros (clientes, provedores ou parceiros);</li>
                            <li>Encontros, transações ou negociações realizadas fora da plataforma;</li>
                            <li>Perdas indiretas, lucros cessantes ou danos morais decorrentes do uso do Serviço;</li>
                            <li>Indisponibilidades causadas por força maior, ataques ou falhas de provedores externos (Cloudflare, Railway, Mercado Pago, Google).</li>
                        </ul>
                        <p>
                            Em qualquer hipótese de responsabilização, esta fica limitada ao
                            valor pago pelo usuário nos 12 meses anteriores ao evento.
                        </p>
                    </Section>

                    <Section n="11" title="Alteração dos Termos">
                        <p>
                            Estes Termos podem ser atualizados a qualquer momento. Alterações
                            substanciais serão comunicadas com pelo menos <strong>30 dias de
                                antecedência</strong> por e-mail e por aviso na plataforma. O uso
                            continuado após a entrada em vigor configura aceitação da nova
                            versão. Caso discorde, você poderá encerrar sua conta antes da data
                            de vigência.
                        </p>
                    </Section>

                    <Section n="12" title="Lei aplicável e foro">
                        <p>
                            Estes Termos são regidos pela legislação brasileira. Fica eleito o
                            <strong> foro da Comarca de Blumenau-SC</strong> para dirimir
                            quaisquer controvérsias decorrentes destes Termos, com renúncia
                            expressa a qualquer outro, por mais privilegiado que seja.
                        </p>
                    </Section>

                    <Section n="13" title="Contato">
                        <p>
                            Dúvidas, solicitações de ajuste, reclamações ou requerimentos legais
                            devem ser enviados a <a href="mailto:contato.privello@gmail.com" className="underline">contato.privello@gmail.com</a>.
                        </p>
                    </Section>
                </div>
            </main>
            <SiteFooter />
        </>
    );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="font-serif text-2xl">
                <span className="mr-2 text-muted">{n}.</span>
                {title}
            </h2>
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}
