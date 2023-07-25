import React, { useEffect, useState, SyntheticEvent, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from 'react-bootstrap'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import { PageCallback } from 'react-pdf/dist/cjs/shared/types'
import { Resizable, ResizeCallbackData } from 'react-resizable'

type DimensionProps = { width: number, height: number }
type PositionProps = { x: number, y: number }

const pixelToMillimeter = (value: number) => {
	const inchToMm = 25.4
	const dpi = 96
	return value * (inchToMm / dpi)
}

const App = () => {
	const [totalPages, setTotalPages] = useState<number | null>(null)
	const [pageNumber, setPageNumber] = useState<number>(1)
	const [canvasSize, setCanvasSize] = useState<DimensionProps>({ width: 0, height: 0 })
	const [pdfSize, setPdfSize] = useState<DimensionProps>({ width: 0, height: 0 })
	const [signaturePosition, setSignaturePosition] = useState<PositionProps>({ x: 0, y: 0 })
	const [signatureDimension, setSignatureDimension] = useState<DimensionProps>({ width: 200, height: 50 })
	const documentRef = useRef<HTMLDivElement>(null)
	const signatureRef = useRef<HTMLDivElement>(null)

	const handlePreviousPage = (): void => setPageNumber(pageNumber => pageNumber - 1)
	const handleNextPage = (): void => setPageNumber(pageNumber => pageNumber + 1)
	const handleOnLoadDocumentSuccess = (totalPages: number): void => setTotalPages(totalPages)

	const handleOnLoadPageSuccess = (page: PageCallback): void => {
		const { width, height } = page.getViewport({ scale: 1.5 })
		setPdfSize({ width, height })
		setCanvasSize({
			width: documentRef.current!.clientWidth,
			height: documentRef.current!.clientHeight
		})
	}

	const handleOnDragStop = (e: DraggableEvent, data: DraggableData): void => {
		const realPdfSize: DimensionProps = {
			width: pdfSize.width,
			height: pdfSize.height
		}

		const scaleFactor: PositionProps = {
			x: realPdfSize.width / canvasSize.width,
			y: realPdfSize.height / canvasSize.height
		}

		const realSignatureDimension: DimensionProps = {
			width: signatureDimension.width * scaleFactor.x,
			height: signatureDimension.height * scaleFactor.y
		}

		const realSignaturePosition: PositionProps = {
			x: signaturePosition.x * scaleFactor.x,
			y: signaturePosition.y * scaleFactor.y
		}

		const position = {
			x: pixelToMillimeter(Math.max(0, realSignaturePosition.x)),
			y: pixelToMillimeter(Math.max(0, realSignaturePosition.y)),
			w: pixelToMillimeter(realSignatureDimension.width),
			h: pixelToMillimeter(realSignatureDimension.height)
		}

		console.log(position)
	}

	const handleOnDrag = (e: DraggableEvent, data: DraggableData): void => {
		setSignaturePosition(prev => ({
			x: prev.x + data.deltaX,
			y: prev.y + data.deltaY
		}))
	}

	const handleOnResizeStop = (e: SyntheticEvent, data: ResizeCallbackData): void => {
		setSignatureDimension({
			width: data.size.width,
			height: data.size.height
		})
	}

	useEffect(() => {
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.min.js',
			import.meta.url,
		).toString()
	})

	return <div className="container py-5">
		<h1 className="my-5 text-center">PDF-Sign</h1>

		<div className="d-flex align-items-center justify-content-center py-3">
			{pageNumber > 1 && <Button variant="primary" onClick={handlePreviousPage}>Previous</Button>}
			<span className="px-3">Page {pageNumber} of {totalPages}</span>
			{pageNumber < totalPages! && <Button variant="primary" onClick={handleNextPage}>Next</Button>}
		</div>

		<div ref={documentRef} className="border border-2 border-dark" style={{ overflow: 'hidden' }}>
			<Draggable onStop={handleOnDragStop} defaultPosition={{ x: 0, y: 0 }} position={{ x: signaturePosition.x, y: signaturePosition.y }} onDrag={handleOnDrag}>
				<Resizable onResizeStop={handleOnResizeStop} width={signatureDimension.width} height={signatureDimension.height} resizeHandles={['nw']}>
					<div className="position-absolute" style={{ zIndex: 1, width: `${signatureDimension.width}px`, height: `${signatureDimension.height}px` }}>
						<div ref={signatureRef} className="d-flex align-items-center justify-content-center bg-light border border-1" style={{ width: `${signatureDimension.width}px`, height: `${signatureDimension.height}px` }}>
							<p className="fw-bold text-center p-0 m-0" style={{ fontSize: '18px', cursor: "default" }}>Votre signature ici</p>
						</div>
					</div>
				</Resizable>
			</Draggable>

			<Document file="http://127.0.0.1:5173/document.pdf" onLoadSuccess={(document) => handleOnLoadDocumentSuccess(document.numPages)}>
				<Page renderTextLayer={false} pageNumber={pageNumber} scale={1.5} onLoadSuccess={handleOnLoadPageSuccess} />
			</Document>
		</div>
	</div>
}

export default App
