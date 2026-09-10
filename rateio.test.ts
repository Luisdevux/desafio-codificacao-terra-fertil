// rateio.test.ts
import { describe, expect, it } from "vitest";
import { type Associacao, type Distribuicao, type ResultadoRateio, MUDAS_POR_BANDEJA } from "./rateio.js";
import { ratearMudas, RateioError } from "./rateio.js";

// Função que cria associações válidas que me permite sobrescrever apenas os campos desejados para evitar repetição de código
let contadorId = 1;
function criarAssociacao(dadosModificados: Partial<Associacao> = {}): Associacao {
    const id = String(contadorId++).padStart(2, "0");
        return {
        cnpj: `${id}.000.000/0001-${id}`,
        nome: `Associação ${id}`,
        municipio: "Vilhena",
        familias: 50,
        cotaMaxima: 5_000,
        situacao: "regular",
        ...dadosModificados
    }
}

describe("Distribui corretamente os lotes entre as associações e calcula os resultados", () => {

    it("Exemplo 1 - Saturação e redistribuição com os dados do edital", () => {
        const totalMudas = 18_000;

        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "APROPERO",
                municipio: "Chupinguaia",
                familias: 80,
                cotaMaxima: 18_000,
                cnpj: "15.893.829/0001-38",
                situacao: "regular"
            },
            {
                nome: "ARUVE",
                municipio: "Cacoal",
                familias: 80,
                cotaMaxima: 18_000,
                cnpj: "22.859.854/0001-60",
                situacao: "regular"
            },
            {
                nome: "Água Boa",
                municipio: "Água Boa",
                familias: 45,
                cotaMaxima: 2_000,
                cnpj: "34.537.183/0001-09",
                situacao: "regular"
            },
            {
                nome: "ACRUB",
                municipio: "Cacoal",
                familias: 35,
                cotaMaxima: 18_000,
                cnpj: "82.589.865/0001-08",
                situacao: "suspensa"
            },
            {
                nome: "Alto Alegre",
                municipio: "Vale do Anari",
                familias: 0,
                cotaMaxima: 5_000,
                cnpj: "02.785.883/0001-18",
                situacao: "regular"
            }
        ];

        const distribuicaoEsperada: Distribuicao[] = [
            {
                nome: associacoes[1]!.nome,
                cnpj: associacoes[1]!.cnpj,
                bandejas: 120,
                mudas: 6_000
            },
            {
                nome: associacoes[2]!.nome,
                cnpj: associacoes[2]!.cnpj,
                bandejas: 120,
                mudas: 6_000
            },
            {
                nome: associacoes[0]!.nome,
                cnpj: associacoes[0]!.cnpj,
                bandejas: 80,
                mudas: 4_000
            },
            {
                nome: associacoes[3]!.nome,
                cnpj: associacoes[3]!.cnpj,
                bandejas: 40,
                mudas: 2_000
            },
            {
                nome: associacoes[4]!.nome,
                cnpj: associacoes[4]!.cnpj,
                bandejas: 0,
                mudas: 0,
                motivoExclusao: "Situação cadastral: suspensa"
            },
            {
                nome: associacoes[5]!.nome,
                cnpj: associacoes[5]!.cnpj,
                bandejas: 0,
                mudas: 0,
                motivoExclusao: "Associação sem famílias cadastradas"
            }
        ];

        const resultadoEsperado: ResultadoRateio = {
            distribuicoes: distribuicaoEsperada,
            totalDistribuido: 18_000,
            sobraNaoDistribuida: 0
        };

        expect(ratearMudas(totalMudas, associacoes)).toEqual(resultadoEsperado);
    });

    it("Exemplo 2 - Maiores restos, sobra e ordenação com os dados do edital", () => {
        const totalMudas = 5_180;
        const associacoes: Associacao[] = [
            {
                nome: "Alto Alegre",
                municipio: "Vale do Anari",
                cnpj: "02.785.883/0001-18",
                familias: 10,
                cotaMaxima: 100_000,
                situacao: "regular"
            },
            {
                nome: "Água Boa",
                municipio: "Água Boa",
                familias: 10,
                cotaMaxima: 100_000,
                cnpj: "34.537.183/0001-09",
                situacao: "regular"
            },
            {
                nome: "Boa Esperança",
                municipio: "Novo Mundo",
                familias: 5,
                cotaMaxima: 3_000,
                cnpj: "25.027.055/0001-16",
                situacao: "regular"
            }
        ];

        const distribuicaoEsperada: Distribuicao[] = [
            {
                nome: associacoes[1]!.nome,
                cnpj: associacoes[1]!.cnpj,
                bandejas: 41,
                mudas: 2_050
            },
            {
                nome: associacoes[0]!.nome,
                cnpj: associacoes[0]!.cnpj,
                bandejas: 41,
                mudas: 2_050
            },
            {
                nome: associacoes[2]!.nome,
                cnpj: associacoes[2]!.cnpj,
                bandejas: 21,
                mudas: 1_050
            }
        ];

        const resultadoEsperado: ResultadoRateio = {
            distribuicoes: distribuicaoEsperada,
            totalDistribuido: 5150,
            sobraNaoDistribuida: 30
        };

        expect(ratearMudas(totalMudas, associacoes)).toEqual(resultadoEsperado);
    });

    it("Testa distribuição com critério de desempate baseado no CNPJ", () => {
        const totalMudas = 150;

        const associacoes: Associacao[] = [
            criarAssociacao({
                nome: "Associação dos produtores",
                municipio: "Ouro Preto",
                familias: 10,
                cotaMaxima: 1000,
                cnpj: "22.222.222/0001-22"
            }),
            criarAssociacao({
                nome: "Associação dos produtores",
                municipio: "Ji-Paraná",
                familias: 10,
                cotaMaxima: 1000,
                cnpj: "11.111.111/0001-11"
            })
        ];

        const distribuicaoEsperada: Distribuicao[] = [
            {
                nome: associacoes[1]!.nome,
                cnpj: associacoes[1]!.cnpj,
                bandejas: 2,
                mudas: 100
            },
            {
                nome: associacoes[0]!.nome,
                cnpj: associacoes[0]!.cnpj,
                bandejas: 1,
                mudas: 50
            }
        ];

        const resultadoEsperado: ResultadoRateio = {
            distribuicoes: distribuicaoEsperada,
            totalDistribuido: 150,
            sobraNaoDistribuida: 0
        };

        expect(ratearMudas(totalMudas, associacoes)).toEqual(resultadoEsperado);
    });
});

describe("Testa o tratamento de entradas inválidas e testa também o RateioError", () => {

    it("deve lançar erro quando houver CNPJs duplicados na lista", () => {
        const cnpjRepetido = "12.345.678/0001-90";
        const associacoes = [
            criarAssociacao({ cnpj: cnpjRepetido }),
            criarAssociacao({ cnpj: cnpjRepetido })
        ];

        expect(() => ratearMudas(18_000, associacoes)).toThrow(RateioError);
    });

    it("deve lançar erro quando totalMudas for negativo", () => {
        expect(() => ratearMudas(-18_000, [criarAssociacao()])).toThrow(RateioError);
    });

    it("deve lançar erro quando totalMudas for um número de ponto flutuante, deve ser inteiro", () => {
        expect(() => ratearMudas(18_000.12, [criarAssociacao()])).toThrow(RateioError);
    });

    it("deve lançar erro quando alguma associação possuir cotaMaxima negativa", () => {
        const associacoes = [
            criarAssociacao({ cotaMaxima: -4_000 }),
            criarAssociacao()
        ];
        expect(() => ratearMudas(18_000, associacoes)).toThrow(RateioError);
    });

    it("deve lançar erro quando alguma associacao possuir famílias com valor negativo", () => {
        const associacoes = [
            criarAssociacao({ familias: -120 }),
            criarAssociacao()
        ];
        expect(() => ratearMudas(18_000, associacoes)).toThrow(RateioError);
    });

    it("deve lançar erro quando cotaMaxima for um número flutuante", () => {
        const associacoes = [
            criarAssociacao({ cotaMaxima: 4_000.01 }),
            criarAssociacao()
        ];
        expect(() => ratearMudas(18_000, associacoes)).toThrow(RateioError);
    });

    it("deve lançar erro quando o número de familias for flutuante", () => {
        const associacoes = [
            criarAssociacao({ familias: 120.12 }),
            criarAssociacao()
        ];
        expect(() => ratearMudas(18_000, associacoes)).toThrow(RateioError);
    });

    it("deve lançar erro quando cnpj, nome ou município estiverem em branco ou com espaçoes", () => {
        expect(() => ratearMudas(1000, [criarAssociacao({ nome: "  " })])).toThrow(RateioError);
        expect(() => ratearMudas(1000, [criarAssociacao({ cnpj: "" })])).toThrow(RateioError);
        expect(() => ratearMudas(1000, [criarAssociacao({ municipio: " " })])).toThrow(RateioError);
    });

    it("deve lançar erro quando a situação cadastral for desconhecida ou não existir", () => {
        const associacaoInvalida = criarAssociacao({ situacao: "pendente" as any })
        expect(() => ratearMudas(1000, [associacaoInvalida])).toThrow(RateioError);
    });
    
    it("deve lançar erro quando a lista de associações não for um array válido ou ter dados inválidos", () => {
        expect(() => ratearMudas(1000, null as any)).toThrow(RateioError);
        expect(() => ratearMudas(1000, "inválido" as any)).toThrow(RateioError);
        expect(() => ratearMudas(1000, [null as any])).toThrow(RateioError);
    });
});

describe("Testa Casos Degenerados Válidos, que devem retornar o resultado normal, sem erros", () => {
    it("deve lidar corretamente com lista de associações vazia", () => {
        const resultado = ratearMudas(5000, []);
        expect(resultado).toEqual({
            distribuicoes: [],
            totalDistribuido: 0,
            sobraNaoDistribuida: 5000
        })
    });
    it("deve lidar corretamente com totalMudas igual a zero", () => {
        const resultado = ratearMudas(0, [criarAssociacao()]);
        expect(resultado.totalDistribuido).toBe(0);
        expect(resultado.sobraNaoDistribuida).toBe(0);
        expect(resultado.distribuicoes[0]?.bandejas).toBe(0);
        expect(resultado.distribuicoes[0]?.mudas).toBe(0);
    });

    it(`deve enviar tudo para sobra quando totalMudas for menor que uma bandeja < ${MUDAS_POR_BANDEJA}`, () => {
        const resultado = ratearMudas(MUDAS_POR_BANDEJA - 10, [criarAssociacao()]);
        expect(resultado.totalDistribuido).toBe(0);
        expect(resultado.sobraNaoDistribuida).toBe(MUDAS_POR_BANDEJA - 10);
        expect(resultado.distribuicoes[0]?.bandejas).toBe(0);
        expect(resultado.distribuicoes[0]?.mudas).toBe(0);
    });

    it("deve lidar corretamente com o cenário onde todas as associações são inelegíveis 'excluídas'", () => {
        const associacoes = [
            criarAssociacao({ situacao: "suspensa" }),
            criarAssociacao({ familias: 0 })
        ];

        const resultado = ratearMudas(1000, associacoes);
        expect(resultado.totalDistribuido).toBe(0);
        expect(resultado.sobraNaoDistribuida).toBe(1000);
        // Uso o método every para garantir que todas as distribuições tenham bandejas e mudas zeradas, e motivoExclusao preenchido
        expect(resultado.distribuicoes.every(d => d.bandejas === 0 && d.mudas === 0)).toBe(true);
        expect(resultado.distribuicoes.every(d => typeof d.motivoExclusao === "string")).toBe(true);
    });
});

describe("Testa as Regras de Negócio Especificadas pelo Edital, Invariante e Imutabilidade", () => {

    it("Regra R5: deve enviar excedente para sobra quando todas ficarem saturadas na cota máxima", () => {
        const associacoes = [
            criarAssociacao({ cotaMaxima: 50 }), // 1 bandeja
            criarAssociacao({ cotaMaxima: 50 })  // 1 bandeja
        ];

        // Lote de 500 mudas (10 bandejas). Ambas só podem receber 1 bandeja cada, no total 100 mudas
        // As 400 restantes devem ir para sobraNaoDistribuida
        const resultado = ratearMudas(500, associacoes);

        expect(resultado.distribuicoes[0]?.bandejas).toBe(1);
        expect(resultado.distribuicoes[0]?.mudas).toBe(50);
        expect(resultado.distribuicoes[1]?.bandejas).toBe(1);
        expect(resultado.distribuicoes[1]?.mudas).toBe(50);

        expect(resultado.totalDistribuido).toBe(100);
        expect(resultado.sobraNaoDistribuida).toBe(400);
    });

    it("Regra R8: a invariante (totalDistribuida + sobraNaoDistribuida === totalMudas) deve ser sempre respeitada", () => {
        const associacoes = [
            criarAssociacao({ familias: 33, cotaMaxima: 3500 }),
            criarAssociacao({ familias: 17, cotaMaxima: 1500 })
        ];

        const totalMudas = 7_389; // Ímpar e múltiplo de 50
        const resultado = ratearMudas(totalMudas, associacoes);

        expect(resultado.totalDistribuido + resultado.sobraNaoDistribuida).toBe(totalMudas);
    });

    it("deve garantir imutabilidade estrita da entrada recebida", () => {
        const associacoes = [criarAssociacao({ familias: 15, cotaMaxima: 2000 })];
        const cloneComparacao = JSON.parse(JSON.stringify(associacoes));

        ratearMudas(1000, associacoes);

        expect(associacoes).toEqual(cloneComparacao);
    });
});