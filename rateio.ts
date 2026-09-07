export const CODIGO_DESAFIO = "TF-2026-___";

export const MUDAS_POR_BANDEJA = 50;

export type SituacaoCadastral = "regular" | "suspensa" | "irregular";

// Classe RateioError que vai lançar alguns erros especificos.
// 'extends' reconhece a classe RateioError como um erro oficial que herda a classe Error nativa.
// 'super' ativa o construtor da classe Error nativa com a mensagem que vai ser disparada.
// A escolha por usar o this.name é para deixar o nome claro e dar mais rastreabilidade ao erro.
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

export function ratearMudas(
    totalMudas: number,
    associacoes: Associacao[]
): ResultadoRateio {

}
