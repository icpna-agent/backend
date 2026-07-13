import { ApiProperty } from '@nestjs/swagger';

export class AuthLoginTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refresh!: string;
}

export class AuthUserPayloadDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'santi' })
  user!: string;

  @ApiProperty({ example: '951364862' })
  phone!: string;
}

export class AuthTokenResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: AuthLoginTokenDto })
  body!: AuthLoginTokenDto;
}

export class AuthLogoutResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ example: null, nullable: true, type: String })
  body!: string | null;
}

export class AuthMeResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: AuthUserPayloadDto })
  body!: AuthUserPayloadDto;
}
