import { IsEmail, IsOptional, IsString } from 'class-validator';

export class GoogleSignInDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  /**
   * One-time code dari Google Sign In SDK di mobile.
   * FE dapat ini dari: userInfo.data?.serverAuthCode
   *
   * BE menukar kode ini dengan refreshToken via Google OAuth API.
   * Kenapa di BE? Karena butuh client_secret yang tidak boleh di FE.
   *
   * Optional karena:
   * - User lama yang sudah pernah otorisasi mungkin tidak kirim ini
   * - Bisa null kalau Google tidak kembalikan (sudah pernah auth sebelumnya)
   */
  @IsOptional()
  @IsString()
  serverAuthCode?: string;
}
