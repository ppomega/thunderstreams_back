import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import crypto from "crypto-js";

async function Fetch(path: string, range?: string): Promise<any> {
  const accessKeyId:string|undefined = process.env.SECRET_ID;
  const secretAccessKey:string|undefined = process.env.SECRET_KEY;
  const region = "auto";
  const service = "s3";
  const host:string|undefined = process.env.HOST; // Replace with your Cloudflare account ID
  const method = "GET";
  const currentDate = new Date();

  const amzDate =
    currentDate
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "")
      .substr(0, 15) + "Z";
  const dateStamp = amzDate.substr(0, 8);
  var payloadHash = "UNSIGNED-PAYLOAD";
  // S3 signs the URL-encoded path. Keep slashes as separators, but encode each
  // object-key segment so names containing spaces or other reserved chars work.
  const objectPath = path.split("/").map((part) => encodeURIComponent(part)).join("/");
  const canonicalUri = `/thunder-streams/${objectPath}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}${signedHeaders}\n${payloadHash}`;
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto
    .SHA256(canonicalRequest)
    .toString(crypto.enc.Hex)}`;
  function getSignatureKey(key:string|undefined, dateStamp:string, regionName:string, serviceName:string) {
    const kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
    const kRegion = crypto.HmacSHA256(regionName, kDate);
    const kService = crypto.HmacSHA256(serviceName, kRegion);
    const kSigning = crypto.HmacSHA256("aws4_request", kService);
    return kSigning;
  }
  const signingKey = getSignatureKey(
    secretAccessKey,
    dateStamp,
    region,
    service
  );
  const signature = crypto
    .HmacSHA256(stringToSign, signingKey)
    .toString(crypto.enc.Hex);

  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  let config: AxiosRequestConfig = {
    method: "GET",
    url: `https://${host}/thunder-streams/${objectPath}`,
    headers: {
      Authorization: authorizationHeader,
      Host: host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...(range ? { Range: range } : {}),
    },
    responseType: "stream",
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  };
  // Let the caller handle the upstream status. Returning undefined here turns
  // an R2 404 into a secondary "cannot read headers" error in the route.
  return await axios.request(config);
}

export default Fetch;
