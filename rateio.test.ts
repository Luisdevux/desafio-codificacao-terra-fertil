// rateio.test.ts
import { describe, expect, it } from "vitest";
import type { Associacao, Distribuicao, ResultadoRateio } from "./rateio.js";
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
});