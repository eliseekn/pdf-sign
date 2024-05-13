import React, { ChangeEvent, useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from 'react-bootstrap'
import { PageCallback } from 'react-pdf/dist/cjs/shared/types'
import { Rnd, RndDragCallback, RndResizeCallback } from "react-rnd"

type DimensionProps = { width: number, height: number }
type PositionProps = { x: number, y: number }

const pixelToMillimeter = (value: number) => value * 0.2645833333

const App: React.FC = () => {
	const [totalPages, setTotalPages] = useState<number | null>(null)
	const [pageNumber, setPageNumber] = useState<number>(1)
	const [pdfSize, setPdfSize] = useState<DimensionProps>({ width: 0, height: 0 })
	const [signaturePosition, setSignaturePosition] = useState<PositionProps>({ x: 0, y: 0 })
	const [signatureDimension, setSignatureDimension] = useState<DimensionProps>({ width: 100, height: 30 })
	const [signature, setSignature] = useState<any>({})
	const [file, setFile] = useState<File | null>(null)

	const handlePreviousPage = (): void => setPageNumber(pageNumber => pageNumber - 1)
	const handleNextPage = (): void => setPageNumber(pageNumber => pageNumber + 1)
	const handleOnLoadDocumentSuccess = (totalPages: number): void => setTotalPages(totalPages)

	const handleSetFile = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]

		if (file) {
			setFile(file)
		}
	}
	
	const handleOnLoadPageSuccess = (page: PageCallback): void => {
		setPdfSize({
			width: page.view[2],
			height: page.view[3]
		})
	}

	const handleSetSignature = (): void => {
		const signature = {
			x: pixelToMillimeter(Math.max(0, signaturePosition.x * 1.35)),
			y: pixelToMillimeter(Math.max(0, signaturePosition.y * 1.35)),
			w: pixelToMillimeter(signatureDimension.width) * 1.5,
			h: pixelToMillimeter(signatureDimension.height) * 1.5
		}

		setSignature(signature)
	}

	const handleOnDrag: RndDragCallback = (e, d) => {
		setSignaturePosition({ x: d.x, y: d.y })
		handleSetSignature()
	}

	const handleOnResize: RndResizeCallback = (e, direction, ref, delta, position) => {
		setSignatureDimension({
		  width: ref.offsetWidth,
		  height: ref.offsetHeight,
		})

		handleSetSignature()
	}

	useEffect(() => {
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.min.js',
			import.meta.url,
		).toString()
	})

	return <div className="container py-5">
		<div className="my-5 text-center">
			<img src="https://dkbsign.com/static/media/logodkbsign.f4eac87235d0e1e8adaa.png" alt="DKBSign" width="300" />
		</div>

		<div className="mt-3 mb-5 d-flex justify-content-center align-items-center">
			<div>
				<input type="file" className='form-control' accept='application/pdf' onChange={handleSetFile} />
			</div>
		</div>

		<div className="d-flex align-items-center justify-content-center my-3">
			{pageNumber > 1 && <Button variant="primary" onClick={handlePreviousPage}>Previous</Button>}
			<span className="px-3">Page {pageNumber} of {totalPages}</span>
			{pageNumber < totalPages! && <Button variant="primary" onClick={handleNextPage}>Next</Button>}
		</div>

		<div className="d-flex justify-content-center">
			<div className="border border-2 border-dark" style={{ overflow: 'hidden', width: pdfSize.width, height: pdfSize.height }}>
				<div style={{position: 'relative'}}>
					<Rnd
						style={{position: 'absolute', zIndex: 1, width: `${signatureDimension.width}px`, height: `${signatureDimension.height}px`}}
						position={{x: signaturePosition.x, y: signaturePosition.y}}
						size={{width: signatureDimension.width, height: signatureDimension.height}}
						onResize={handleOnResize}
						onDrag={handleOnDrag}
					>
						<div className="d-flex align-items-center justify-content-center bg-light border border-1" style={{ width: `${signatureDimension.width}px`, height: `${signatureDimension.height}px` }}>
							<p className="fw-bold text-center p-0 m-0" style={{ fontSize: '10px', cursor: "default" }}>Votre signature ici</p>
						</div>
					</Rnd>
				</div>

				<Document file={file ? file : "./sample.pdf"} onLoadSuccess={(document) => handleOnLoadDocumentSuccess(document.numPages)}>
					<Page renderTextLayer={false} pageNumber={pageNumber} onLoadSuccess={handleOnLoadPageSuccess} />
				</Document>
			</div>

			<div className='ms-3'>
				<p>posX_Imgsign: {signature.x ?? 0}</p>
				<p>posY_Imgsign: {signature.y ?? 0}</p>
				<p>Largeur_img_signataire_png: {signature.w ?? 0}</p>
				<p>Hauteur_img_signataire_png: {signature.h ?? 0}</p>
			</div>
		</div>
	</div>
}

export default App
