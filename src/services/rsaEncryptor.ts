import JSEncrypt from "jsencrypt";
import { getPublicKey } from "../api/authApi";

/**
 * Fetch and cache backend public key
 */
async function getPublicKeyPem() {

  const { data } = await getPublicKey();
  const publicKeyBase64 = data.publicKey;

  const publicKeyPem =
    "-----BEGIN PUBLIC KEY-----\n" +
    publicKeyBase64.match(/.{1,64}/g).join("\n") +
    "\n-----END PUBLIC KEY-----";

  return publicKeyPem;
}

/**
 * Encrypt text with backend public key
 */
export async function encryptWithBackendKey(text) {
  const publicKeyPem = await getPublicKeyPem();

  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKeyPem);

  const encrypted = encryptor.encrypt(text);
  if (!encrypted) {
    throw new Error("Encryption failed. Check public key and input.");
  }
  return encrypted;
}
