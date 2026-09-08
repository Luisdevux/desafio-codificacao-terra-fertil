export const MUDAS_POR_BANDEJA = 50;

export type SituacaoCadastral = "regular" | "suspensa" | "irregular";

// Classe RateioError que vai lançar alguns erros especificos
// 'extends' reconhece a classe RateioError como um erro oficial que herda a classe Error nativa
// 'super' ativa o construtor da classe Error nativa com a mensagem que vai ser disparada
// A escolha por usar o this.name é para deixar o nome claro e dar mais rastreabilidade ao erro
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
    // !Number.isInteger já cobre casos onde o valor é NaN, null, undefined, string, números quebrados...
    // tudo que poderia falhar nas validações e causar problemas
    if(!Number.isInteger(totalMudas) || totalMudas < 0) {
        throw new RateioError("O total de mudas deve ser um número e não pode ser negativo!");
    }

    if(!Array.isArray(associacoes)) {
        throw new RateioError("A lista de associações deve ser um array!");
    }

    const cnpjsValidos = new Set<string>(); //Set é uma coleção de valores únicos que não vai deixar repetir
    for(const associacao of associacoes) {
        // Validação simples para previnir algo fora do padrão esperado e garantir objetos
        if(!associacao || typeof associacao !== "object") {
            throw new RateioError("Entrada inválida, associacao deve ser um objeto!");
        }

        // Se algum dos campos vierem vazios ou inválidos, vai cair no erro, fazendo meio que o trabalho que o Zod faria
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

        // Aqui valida se a associação tem uma situação válida
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

    


}
