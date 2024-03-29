import { Browser, Page } from "puppeteer";
import { Court } from "../court/model";

export class PreloadedFirstDegreePageManager {
    private preloadedFirstDegreePages: {
        TJAL: { url: string, pages: Page[] },
        TJCE: { url: string, pages: Page[] }
    } = {
            TJAL: { url: "https://www2.tjal.jus.br/cpopg/open.do", pages: [] },
            TJCE: { url: "https://esaj.tjce.jus.br/cpopg/open.do", pages: [] }
        }
    private readonly poolSize: number;

    private constructor(private readonly puppeeterBrowser: Browser, poolSize: number) {
        this.poolSize = poolSize;
    }

    public async acquirePage(court: Court): Promise<Page> {
        if (this.preloadedFirstDegreePages[court].pages.length === 0) {
            return this.createPreloadedFirstDegreePage(this.preloadedFirstDegreePages[court].url);
        } else {
            return this.preloadedFirstDegreePages[court].pages.pop()!;
        }
    }

    public async releasePage(page: Page, court: Court) {
        await page.goto(this.preloadedFirstDegreePages[court].url);
        this.preloadedFirstDegreePages[court].pages.push(page);
    }

    private async init() {
        const promises: Promise<Page>[] = [];
        for (let i = 0; i < this.poolSize; i++) {
            promises.push(this.createPreloadedFirstDegreePage(this.preloadedFirstDegreePages.TJAL.url));
        }
        for (let i = 0; i < this.poolSize; i++) {
            promises.push(this.createPreloadedFirstDegreePage(this.preloadedFirstDegreePages.TJCE.url));
        }
        const [tjalPages, tjcePages] = await Promise.all([
            Promise.all(promises.slice(0, this.poolSize)),
            Promise.all(promises.slice(this.poolSize))
        ]);
        this.preloadedFirstDegreePages.TJAL.pages = tjalPages;
        this.preloadedFirstDegreePages.TJCE.pages = tjcePages;
    }

    private async createNewPage() {
        const newBrowserContext = await this.puppeeterBrowser.createIncognitoBrowserContext();
        return newBrowserContext.newPage();
    }

    private async createPreloadedFirstDegreePage(preloadFirstDegreeUrl: string) {
        const newPage = await this.createNewPage();
        await newPage.goto(preloadFirstDegreeUrl);
        return newPage;
    }

    public static async create(puppeeterBrowser: Browser, poolSize = 10) {
        const preloadedFirstDegreePageManager = new PreloadedFirstDegreePageManager(puppeeterBrowser, poolSize);
        await preloadedFirstDegreePageManager.init();
        return preloadedFirstDegreePageManager;
    }
}
