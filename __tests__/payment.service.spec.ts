import { BadRequestException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { PaymentService } from '../src/modules/payment/payment.service';

describe('PaymentService validateInput', () => {
    it('rejects a notification payload whose shape does not match the expected Mercado Pago schema', async () => {
        const service = new PaymentService({} as any, {
            mpAccessToken: 'token',
            webhookSecret: 'secret',
            generateMercadoPagoPreferences: jest.fn(),
        } as any);

        const request = {
            headers: {
                'x-signature': 'ts=123,signature=dummy',
            },
            body: {
                id: 12345,
                live_mode: true,
                type: 'payment',
                date_created: '2015-03-25T10:04:58.396-04:00',
                user_id: 44444,
                api_version: 'v1',
                action: 'payment.created',
                data: {
                    id: false,
                },
            },
        } as unknown as ExpressRequest;

        await expect(service.reactAgainstMpNotif(request, {} as ExpressResponse)).rejects.toThrow(BadRequestException);
    });

    it('returns a 200 OK response for a valid notification payload', async () => {
        const service = new PaymentService({} as any, {
            mpAccessToken: 'token',
            webhookSecret: 'secret',
            generateMercadoPagoPreferences: jest.fn(),
        } as any);

        const response = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as ExpressResponse;

        const signature = crypto
            .createHmac('sha256', 'secret')
            .update('id:abc;ts:123')
            .digest('hex');

        const request = {
            headers: {
                'x-signature': `ts=123,signature=${signature}`,
            },
            body: {
                id: 12345,
                live_mode: true,
                type: 'payment',
                date_created: '2015-03-25T10:04:58.396-04:00',
                user_id: 44444,
                api_version: 'v1',
                action: 'payment.created',
                data: {
                    id: 'abc',
                },
            },
        } as unknown as ExpressRequest;

        await service.reactAgainstMpNotif(request, response);

        expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(response.send).toHaveBeenCalled();
    });
});
