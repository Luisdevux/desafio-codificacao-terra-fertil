export const CODIGO_DESAFIO = "TF-2026-___";

export const MUDAS_POR_BANDEJA = 50;

export type SituacaoCadastral = "regular" | "suspensa" | "irregular";

// Classe que vai lançar alguns erros especificos
export class RateioError extends Error {
    
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
