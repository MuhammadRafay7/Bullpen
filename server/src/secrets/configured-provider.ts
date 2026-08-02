import { SECRET_PROVIDERS, type SecretProvider } from "@bullpen/shared";

export function getConfiguredSecretProvider(): SecretProvider {
  const configuredProvider = process.env.BULLPEN_SECRETS_PROVIDER;
  return configuredProvider && SECRET_PROVIDERS.includes(configuredProvider as SecretProvider)
    ? configuredProvider as SecretProvider
    : "local_encrypted";
}
