# Fiscal

⚖️ Fiscal Pro — Assistente de Retenções & ISS
O Fiscal Pro é um dashboard inteligente projetado para analistas fiscais que precisam de agilidade na conferência de Notas Fiscais de Serviços. O sistema automatiza a identificação de retenções com base no regime do emitente, descrição do serviço e local de execução.

🚀 Funcionalidades Principais
Veredito Inteligente (SIM/NÃO): Identificação visual imediata (Verde/Laranja/Vermelho) sobre a necessidade de retenção.

Análise de Texto Nativa: Identifica automaticamente serviços críticos que geram Cota Patronal (CPP 20%) no MEI ou retenção por cessão de mão de obra.

Gestão do Art. 3º (ISS): Sistema de exceções configurável para determinar se o ISS é devido no Município do Emitente ou do Tomador.

Formatação Automática: Input inteligente de Código LC 116 que aplica a máscara 00.00.00 em tempo real.

Histórico de Favoritos: Salva análises completas, incluindo o veredito de retenção e a rota do serviço (Emitente → Tomador).

Portabilidade de Dados: Funções de Exportação e Importação via JSON para backup imediato.

🛠️ Regras de Negócio Integradas
1. MEI (CPP 20% - Cota Patronal)
Serviços: Elétrica, hidráulica, alvenaria, conserto de veículos, pintura (predial/civil) e carpintaria.

Ação: Identificada a cota, o sistema orienta o envio via e-mail e WhatsApp: "07.02 QUOTA".

2. Simples Nacional & Não Optantes
Serviços Críticos: Paisagismo, decoração, limpeza, advocacia, contabilidade, vigilância, cessão de mão de obra e dedetização.

Retenções Federais: Alerta para 4,65% (CSRF) e IRRF em regimes Não Optantes.

🗺️ Roadmap de Desenvolvimento (Futuro)
Atualmente, o Fiscal Pro opera utilizando o LocalStorage do navegador (armazenamento local). No entanto, o projeto já possui em seu roadmap:

☁️ Migração para Supabase: Integração futura com o Supabase (PostgreSQL) para atuar como banco de dados principal.

👥 Sincronização em Nuvem: Permitir que múltiplos usuários da mesma equipe acessem os mesmos favoritos e notas.

🔐 Autenticação: Login seguro para preservação dos dados entre diferentes dispositivos.

📂 Estrutura do Projeto
index.html: Dashboard com Sidebar e Modais.

style.css: Interface moderna com suporte a estados críticos.

script.js: Motor de análise e lógica de persistência atual.
