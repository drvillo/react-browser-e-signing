import { useEffect, useMemo, useState } from 'react'
import {
  FieldOverlay,
  FieldPalette,
  PdfViewer,
  SignaturePreview,
  SignerDetailsPanel,
  SigningComplete,
  defaults,
  modifyPdf,
  sha256,
  useFieldPlacement,
  usePdfDocument,
  useSignatureRenderer,
} from '../src/index'
import type { FieldType, SignatureFieldPreview, SignatureStyle, SignerInfo, SigningResult } from '../src/types'

interface SignedDocumentState {
  result: SigningResult
  downloadUrl: string
  signedAt: string
}

type DemoTheme = 'default' | 'custom'

const THEME_FILE_MAP: Record<DemoTheme, string> = {
  default: '/themes/default-theme.css',
  custom: '/themes/custom-theme.css',
}

function signerDisplayName(signerInfo: SignerInfo): string {
  return [signerInfo.firstName, signerInfo.lastName].filter(Boolean).join(' ').trim()
}

function createDefaultSigner(): SignerInfo {
  return {
    firstName: '',
    lastName: '',
    title: '',
  }
}

function todayDateText(): string {
  return new Date().toLocaleDateString()
}

export function App() {
  const [theme, setTheme] = useState<DemoTheme>('default')
  const [pdfInput, setPdfInput] = useState<File | null>(null)
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(null)
  const [signerInfo, setSignerInfo] = useState<SignerInfo>(createDefaultSigner())
  const [signatureStyle, setSignatureStyle] = useState<SignatureStyle>({
    mode: 'typed',
    fontFamily: defaults.SIGNATURE_FONTS[0],
  })
  const [signedDocument, setSignedDocument] = useState<SignedDocumentState | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    pdfData,
    numPages,
    scale,
    setScale,
    pageDimensions,
    setPageDimension,
    handleDocumentLoadSuccess,
    errorMessage: documentErrorMessage,
  } = usePdfDocument(pdfInput)

  const { fields, addField, updateField, removeField, clearFields } = useFieldPlacement({
    defaultWidthPercent: defaults.DEFAULT_FIELD_WIDTH_PERCENT,
    defaultHeightPercent: defaults.DEFAULT_FIELD_HEIGHT_PERCENT,
  })

  const displayName = useMemo(() => signerDisplayName(signerInfo), [signerInfo])
  const { signatureDataUrl, isRendering } = useSignatureRenderer({
    signerName: displayName,
    style: signatureStyle,
  })
  const dateText = useMemo(() => todayDateText(), [])

  const fieldPreview: SignatureFieldPreview = useMemo(
    () => ({
      signatureDataUrl,
      fullName: displayName,
      title: signerInfo.title,
      dateText,
    }),
    [dateText, displayName, signatureDataUrl, signerInfo.title]
  )

  useEffect(() => {
    if (!signedDocument) return
    return () => URL.revokeObjectURL(signedDocument.downloadUrl)
  }, [signedDocument])

  useEffect(() => {
    const linkId = 'esig-theme-link'
    let linkElement = document.getElementById(linkId) as HTMLLinkElement | null

    if (!linkElement) {
      linkElement = document.createElement('link')
      linkElement.id = linkId
      linkElement.rel = 'stylesheet'
      document.head.appendChild(linkElement)
    }

    linkElement.href = THEME_FILE_MAP[theme]
    document.body.dataset.theme = theme
  }, [theme])

  async function handleSignDocument(): Promise<void> {
    if (!pdfInput) {
      setErrorMessage('Upload a PDF before signing.')
      return
    }
    if (!fields.length) {
      setErrorMessage('Place at least one field before signing.')
      return
    }
    if (!displayName) {
      setErrorMessage('Enter signer first and last name before signing.')
      return
    }
    if (!signatureDataUrl) {
      setErrorMessage('Create a signature first (typed or drawn).')
      return
    }

    const confirmed = window.confirm(`You are about to sign this document as ${displayName}. Continue?`)
    if (!confirmed) return

    setIsSigning(true)
    setErrorMessage(null)

    try {
      const inputBytes = new Uint8Array(await pdfInput.arrayBuffer())
      const signedPdfBytes = await modifyPdf({
        pdfBytes: inputBytes,
        fields,
        signer: signerInfo,
        signatureDataUrl,
        pageDimensions,
        dateText,
      })
      const hash = await sha256(signedPdfBytes)
      const blob = new Blob([signedPdfBytes as BlobPart], { type: 'application/pdf' })
      const downloadUrl = URL.createObjectURL(blob)
      setSignedDocument({
        result: {
          pdfBytes: signedPdfBytes,
          sha256: hash,
        },
        downloadUrl,
        signedAt: new Date().toISOString(),
      })
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign PDF')
    } finally {
      setIsSigning(false)
    }
  }

  function handleReset(): void {
    if (signedDocument) URL.revokeObjectURL(signedDocument.downloadUrl)
    setSignedDocument(null)
    setPdfInput(null)
    clearFields()
    setErrorMessage(null)
  }

  function handleAddField(input: { pageIndex: number; type: FieldType; xPercent: number; yPercent: number }): void {
    addField(input)
    setSelectedFieldType(null)
  }

  return (
    <div data-demo-slot="shell" className="mx-auto w-full max-w-[1400px] space-y-4 p-4 md:p-6">
      <header data-demo-slot="header" className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 data-demo-slot="title" className="text-xl font-semibold text-slate-900">
            Browser E-Signature Demo
          </h1>
          <button
            type="button"
            data-demo-slot="theme-toggle"
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setTheme(theme === 'default' ? 'custom' : 'default')}
          >
            Theme: {theme === 'default' ? 'Default' : 'Custom'}
          </button>
        </div>
        <p data-demo-slot="subtitle" className="text-sm text-slate-600">
          Upload, place fields, sign, and download fully in-browser. Toggle themes to verify style-agnostic library
          components.
        </p>
      </header>

      <div data-demo-slot="upload-card" className="rounded-lg border border-slate-300 bg-white p-4">
        <label data-demo-slot="upload-label" className="block text-sm font-medium text-slate-700">
          Upload PDF
          <input
            type="file"
            accept="application/pdf"
            data-demo-slot="upload-input"
            className="mt-2 block w-full rounded border border-slate-300 p-2 text-sm"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null
              setPdfInput(nextFile)
              setSignedDocument(null)
              clearFields()
              setErrorMessage(null)
            }}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <FieldPalette selectedFieldType={selectedFieldType} onSelectFieldType={setSelectedFieldType} />
          {signedDocument ? (
            <SigningComplete
              signerName={displayName}
              fieldCount={fields.length}
              signedAt={new Date(signedDocument.signedAt).toLocaleString()}
              documentHash={signedDocument.result.sha256}
              downloadUrl={signedDocument.downloadUrl}
              fileName={`signed-${Date.now()}.pdf`}
              onReset={handleReset}
            />
          ) : null}
          <PdfViewer
            pdfData={pdfData}
            numPages={numPages}
            scale={scale}
            onScaleChange={setScale}
            onDocumentLoadSuccess={handleDocumentLoadSuccess}
            onPageDimensions={({ pageIndex, widthPt, heightPt }) => setPageDimension(pageIndex, widthPt, heightPt)}
            renderOverlay={(pageIndex) => (
              <FieldOverlay
                pageIndex={pageIndex}
                fields={fields}
                selectedFieldType={selectedFieldType}
                onAddField={handleAddField}
                onUpdateField={updateField}
                onRemoveField={removeField}
                preview={fieldPreview}
              />
            )}
          />
        </section>

        <aside className="space-y-4">
          <SignerDetailsPanel signerInfo={signerInfo} onSignerInfoChange={setSignerInfo} />
          <SignaturePreview
            signerName={displayName}
            style={signatureStyle}
            signatureDataUrl={signatureDataUrl}
            isRendering={isRendering}
            onStyleChange={setSignatureStyle}
          />

          <div data-demo-slot="sign-card" className="rounded-lg border border-slate-300 bg-white p-4">
            <button
              type="button"
              data-demo-slot="sign-button"
              className="w-full rounded bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={() => void handleSignDocument()}
              disabled={isSigning || !pdfInput || !fields.length}
            >
              {isSigning ? 'Signing...' : 'Sign Document'}
            </button>
          </div>
        </aside>
      </div>

      {documentErrorMessage ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{documentErrorMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
      ) : null}
    </div>
  )
}
