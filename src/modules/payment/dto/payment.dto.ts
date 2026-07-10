import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

export class PaymentDto {
    @ApiProperty({
        example: "ICPNA Assistant - Suscripción mensual",
        description: "Nombre del producto o plan que verá el usuario en Mercado Pago.",
    })
    @IsString()
    name = "ICPNA Assistant - Suscripción mensual";

    @ApiProperty({ example: 5, description: "Precio unitario de la suscripción." })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    price = 5;

    @ApiPropertyOptional({ example: "PEN", description: "Moneda del pago." })
    @IsOptional()
    @IsString()
    unit?: string = "PEN";

    @ApiPropertyOptional({
        example: "https://icpna-assistant.com/logo.png",
        description: "Imagen opcional del producto para Mercado Pago.",
    })
    @IsOptional()
    @IsString()
    img?: string;

    @ApiPropertyOptional({ example: "erick", description: "Usuario registrado en la landing." })
    @IsOptional()
    @IsString()
    user?: string;

    @ApiPropertyOptional({ example: "alumno@utp.edu.pe", description: "Correo del pagador." })
    @IsOptional()
    @IsEmail()
    mail?: string;

    @ApiPropertyOptional({ example: "51999999999", description: "Teléfono/WhatsApp del pagador." })
    @IsOptional()
    @IsString()
    phone?: string;
}
