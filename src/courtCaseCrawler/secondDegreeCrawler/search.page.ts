import { Page } from "puppeteer";
import { Court } from "../../court/model";

export class SecondDegreeSearchPage {
    private urls = {
        TJAL: "https://www2.tjal.jus.br/cposg5",
        TJCE: "https://esaj.tjce.jus.br/cposg5"
    }


    private readonly elementsCSSSelectors = {
        selectedProcessRadioButton: '#processoSelecionado:nth-child(1)',
        mensagemRetorno: '#mensagemRetorno'
    }

    constructor(private readonly page: Page) { }

    public async fetchCaseURL(caseNumber: string, processNumber: string, court: Court): Promise<string> {
        const url = `${this.urls[court]}/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${processNumber}&foroNumeroUnificado=0001&dePesquisaNuUnificado=${caseNumber}&dePesquisaNuUnificado=UNIFICADO&dePesquisa=&tipoNuProcesso=UNIFICADO`;
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });

        await this.ensureNoWarningMessage();

        const selectedProcessRadioButton = await this.page.$(this.elementsCSSSelectors.selectedProcessRadioButton);
        if (selectedProcessRadioButton) {
            const processCode = await selectedProcessRadioButton.evaluate((el) => el.getAttribute('value'));
            return `${this.urls[court]}/show.do?processo.codigo=${processCode}`;
        } else {
            return this.page.url();
        }
    }

    private async ensureNoWarningMessage(): Promise<void> {
        const warningMessage = await this.page.$(this.elementsCSSSelectors.mensagemRetorno);
        if (warningMessage) {
            const warningMessageText = await warningMessage.evaluate((el) => el.textContent);
            if (warningMessageText?.includes("Não existem informações")) {
                throw new Error('CASE NOT FOUND');
            }
        }
    }
}