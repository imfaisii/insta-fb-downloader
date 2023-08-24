import { Controller, Post } from '@nestjs/common';
import { ScrappersService } from './scrappers.service';

@Controller('scrappers')
export class ScrappersController {
    constructor(private readonly scrappersService: ScrappersService) {}

    @Post()
    async scrap() {
        try {
            const { data } = await this.scrappersService.scrap();

            console.log('this is data', data);

            return {
                data: 'done',
            };
        } catch (error) {
            return {
                status: false,
                messsage: error.message,
                data: [],
            };
        }
    }
}
