import { NextResponse } from "next/server";

import { getCmsDocumentByKey, getFallbackCmsDocument } from "@/lib/data/cms";
import { cmsDocumentKeys, type CmsDocumentKey } from "@/lib/data/default-cms";

function isCmsDocumentKey(value: string | null): value is CmsDocumentKey {
  return value !== null && cmsDocumentKeys.includes(value as CmsDocumentKey);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");

  if (!isCmsDocumentKey(keyParam)) {
    return NextResponse.json({ error: "Invalid CMS document key." }, { status: 400 });
  }

  try {
    const document = await getCmsDocumentByKey(keyParam);
    return NextResponse.json({ document });
  } catch {
    return NextResponse.json({ document: getFallbackCmsDocument(keyParam) });
  }
}
