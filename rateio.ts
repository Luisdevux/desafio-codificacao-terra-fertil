// rateio.ts
export const MUDAS_POR_BANDEJA = 50;

export type SituacaoCadastral = "regular" | "suspensa" | "irregular";

export class RateioError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RateioError";
    }
}

export interface Associacao {
    cnpj: string;
    nome: string;
    municipio: string;
    familias: number;
    cotaMaxima: number;
    situacao: SituacaoCadastral;
}

export interface Distribuicao {
    cnpj: string;
    nome: string;
    bandejas: number;
    mudas: number;
    motivoExclusao?: string;
}

export interface ResultadoRateio {
    distribuicoes: Distribuicao[];
    totalDistribuido: number;
    sobraNaoDistribuida: number;
}

export function ratearMudas(totalMudas: number, associacoes: Associacao[]): ResultadoRateio {

    if(!Number.isInteger(totalMudas) || totalMudas < 0) {
        throw new RateioError("O total de mudas deve ser um número e não pode ser negativo!");
    }

    if(!Array.isArray(associacoes)) {
        throw new RateioError("A lista de associações deve ser um array!");
    }

    // Se a lista vier vazia, não vai ter como distribuir nada, então já lança o resultado
    if(associacoes.length === 0) {
        return {
            distribuicoes: [],
            totalDistribuido: 0,
            sobraNaoDistribuida: totalMudas
        };
    }

    const cnpjsValidos = new Set<string>();
    for(const associacao of associacoes) {
        // Validação simples para previnir algo fora do padrão esperado e garantir objetos
        if(!associacao || typeof associacao !== "object") {
            throw new RateioError("Entrada inválida, associacao deve ser um objeto!");
        }

        // Se algum dos campos vierem vazios ou inválidos, vai cair no erro, seria uma forma mais simpless de fazer o que o Zod faria
        const camposTextoInvalidos = 
            typeof associacao.cnpj !== "string" || associacao.cnpj.trim() === "" ||
            typeof associacao.nome !== "string" || associacao.nome.trim() === "" ||
            typeof associacao.municipio !== "string" || associacao.municipio.trim() === "";

        const situacoesValidas: SituacaoCadastral[] = ["regular", "suspensa", "irregular"];

        // Validação dos campos de texto
        if(camposTextoInvalidos) {
            throw new RateioError("Associação com campos de texto inválidos ou vazios!");
        }

        // Validação de números inteiros e positivos
        if(!Number.isInteger(associacao.familias) || associacao.familias < 0 || !Number.isInteger(associacao.cotaMaxima) || associacao.cotaMaxima < 0) {
            throw new RateioError("'Famílias' e 'cota máxima' devem ser números inteiros e não podem ser negativos!");
        }

        // Validação se a associação tem uma situação válida
        if(!situacoesValidas.includes(associacao.situacao)) {
            throw new RateioError(`Situação cadastral inválida: ${associacao.situacao}`);
        }

        // Se o CNPJ da associação já foi inserido antes, vai cair no erro aqui
        if(cnpjsValidos.has(associacao.cnpj)) {
            throw new RateioError(`Associação com CNPJ duplicado: ${associacao.cnpj}`);
        }
        // Se não foi, vai deixar inserir e continuar
        cnpjsValidos.add(associacao.cnpj);
    }

    // Separa as associações em 2 grupos, as regulares e as irregulares
    const distribuidasExcluidas: Distribuicao[] = [];
    const associacoesValidas: Associacao[] = [];

    for(const associacao of associacoes) {
        if(associacao.situacao === "suspensa" || associacao.situacao === "irregular" || associacao.familias === 0) {
            distribuidasExcluidas.push({
                cnpj: associacao.cnpj,
                nome: associacao.nome,
                bandejas: 0,
                mudas: 0,
                motivoExclusao: associacao.situacao !== "regular" ?
                `Situação cadastral: ${associacao.situacao}` : "Associação sem famílias cadastradas"
            });
        } else {
            associacoesValidas.push(associacao);
        }
    }

    // Calcula o total de mudas por bandeja que podem ser distribuídas
    const loteBandejas = Math.floor(totalMudas / MUDAS_POR_BANDEJA);

    // Faço um novo mapeamento com os campos novos e já calculados, e o original fica puro e imutável
    const associacoesParticipantes = associacoesValidas.map(associacao => ({
        cnpj: associacao.cnpj,
        nome: associacao.nome,
        familias: associacao.familias,
        cotaBandejas: Math.floor(associacao.cotaMaxima / MUDAS_POR_BANDEJA),
        bandejas: 0,
        saturado: false
    }));

    let bandejasParaDistribuir = loteBandejas;

    while (true) {
        // Filtra quem ainda pode receber bandejas e não atingiu a cota máxima
        const associacoesDisponiveis = associacoesParticipantes.filter(a => !a.saturado);

        // Se não for mais possível distribuir, sai do loop
        if(associacoesDisponiveis.length === 0 || bandejasParaDistribuir === 0) {
            break;
        }

        // Calcula o total de familias de cada associação que vão participar da rodada de distribuição
        const totalFamilias = associacoesDisponiveis.reduce((soma, a) => soma + a.familias, 0);

        // Calculo da primeira distribuição entre as associações e verifica sobras para nova rodada de distribuição se possível
        const distribuicaoProvisoria = associacoesDisponiveis.map(associacao => {
            const cotaCorreta = (bandejasParaDistribuir * associacao.familias) / totalFamilias; // Cálculo da cota a ser distribuída de bandejas para cada associação
            const cotaInteira = Math.floor(cotaCorreta); // Cálculo da distribuição inteira de bandejas para cada associação
            const resto = cotaCorreta - cotaInteira; // Cálculo das sobras para uma possível nova rodada de distribuição

            return {
                associacao: associacao,
                bandejasTentativas: cotaInteira,
                resto: resto
            };
        })

        // Soma as bandejas que ja foram distribuídas para calcular a sobra para uma nova rodada de distribuição
        const bandejasDistribuidas = distribuicaoProvisoria.reduce((soma, distribuicao) => soma + distribuicao.bandejasTentativas, 0);
        let sobraBandejas = bandejasParaDistribuir - bandejasDistribuidas;

        distribuicaoProvisoria.sort((a, b) => {
            // Quem tiver mais perto de completar uma bandeja inteira, em termos decimais, vai receber primeiro na próxima rodada
            if(b.resto !== a.resto) {
                return b.resto - a.resto;
            }

            // Se as associações tiverem o mesmo resto, ganha quem tiver menos famílias, que é um critério de desempate
            if(a.associacao.familias !== b.associacao.familias) {
                return a.associacao.familias - b.associacao.familias;
            }

            // Então se ainda estiver em situação de empate, faz uma comparação por nomes, com o localeCompare
            // para respeitar a acentuação e a ordem alfabética correta do português brasileiro, ignorando maiúsculas e minúsculas
            const comparacaoPorNome = a.associacao.nome.localeCompare(b.associacao.nome, "pt-BR");
            if(comparacaoPorNome !== 0) {
                return comparacaoPorNome;
            }

            // E se ainda sim empatar, compara CNPJ, já que são únicos e quem tivr o menor, leva
            return a.associacao.cnpj.localeCompare(b.associacao.cnpj, "pt-BR");
        })

        // Agora faz uma nova rodada de distribuição com as sobras, respeitando as regras
        for(let i = 0; i < sobraBandejas; i++) {
            const item = distribuicaoProvisoria[i];
            if(item) {
                item.bandejasTentativas ++;
            }
        }

        const cotaMaximaAtingida = distribuicaoProvisoria.some(
            item => item.bandejasTentativas > item.associacao.cotaBandejas
        );

        // Então se alguma atingiu a cota máxima, vai marcar o campo saturado como true e vai retirar essa associação de uma próxima rodada
        if(cotaMaximaAtingida) {
            for(const item of distribuicaoProvisoria) {
                if(item.bandejasTentativas > item.associacao.cotaBandejas) {
                    item.associacao.bandejas = item.associacao.cotaBandejas;
                    item.associacao.saturado = true;
                }
            }

            // Calcula quantas já foram distribuidas novamente para ver as sobras e continuar a distribuição
            const bandejasJaDistribuidas = associacoesParticipantes.filter(a => a.saturado)
            .reduce((soma, associacao) => soma + associacao.bandejas, 0);

            bandejasParaDistribuir = loteBandejas - bandejasJaDistribuidas;
        } else {
            // Se nenhuma atingiu ainda, só atualiza com a com o número definitivo de bandejas recebidas e sai do loop, acabou as sobras
            for(const item of distribuicaoProvisoria) {
                item.associacao.bandejas = item.bandejasTentativas;
            }

            break;
        }
    }

    // Lista final das distribuições, com o número de bandejas e mudas recebidas por cada associação
    const distribuicoesFinal: Distribuicao[] = associacoesParticipantes.map(associacao => ({
        cnpj: associacao.cnpj,
        nome: associacao.nome,
        bandejas: associacao.bandejas,
        mudas: associacao.bandejas * MUDAS_POR_BANDEJA
    }))

    // Junta as 2 listas das distribuições, as que receberam mudas e as que foram excluídas, para montar e ordenar o resultado final
    const totalDistribuicoesFinal = [ ...distribuicoesFinal, ...distribuidasExcluidas ];

    // O resultado final vai ser ordenado pela associação que tiver mais mudas primeiro, e em caso de empate,
    // vai ordenar por ordem alfabética com o nome da associação
    totalDistribuicoesFinal.sort((a, b) => {
        if(b.mudas !== a.mudas) {
            return b.mudas - a.mudas;
        }
        return a.nome.localeCompare(b.nome, "pt-BR");
    })

    // Então aqui soma tudo que foi distribuido e as sobras que não foram possíveis de serem distribuídas, para montar o resultado final
    const totalDistribuido = totalDistribuicoesFinal.reduce((soma, distribuicao) => soma + distribuicao.mudas, 0);
    const sobraNaoDistribuida = totalMudas - totalDistribuido;

    return {
        distribuicoes: totalDistribuicoesFinal,
        totalDistribuido,
        sobraNaoDistribuida
    }
}