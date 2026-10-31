import PDFDocument from 'pdfkit';
import logger from '../utils/logger';

export const generateCallPDF = async (call: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: any[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 100;

            // --- Header ---
            doc.fontSize(22).font('Helvetica-Bold').text('Call Transcript', { align: 'center' });
            doc.moveDown(0.5);

            // Horizontal Line
            doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#000000').lineWidth(1).stroke();
            doc.moveDown(1.5);

            // --- Call Information ---
            doc.fontSize(16).font('Helvetica-Bold').text('Call Information');
            doc.moveDown(0.5);

            doc.fontSize(11).font('Helvetica-Bold').text('Date & Time: ', { continued: true })
                .font('Helvetica').text(new Date(call.timestamp).toLocaleString());

            doc.fontSize(11).font('Helvetica-Bold').text('Customer Name: ', { continued: true })
                .font('Helvetica').text(call.customerName || 'Unknown');

            doc.fontSize(11).font('Helvetica-Bold').text('Call Duration: ', { continued: true })
                .font('Helvetica').text(`${Math.floor(call.duration / 60)} minutes ${call.duration % 60} seconds`);

            doc.fontSize(11).font('Helvetica-Bold').text('Call ID: ', { continued: true })
                .font('Helvetica').text(call.id.toString());

            doc.moveDown(1.2);

            // Horizontal Line
            doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#000000').lineWidth(1).stroke();
            doc.moveDown(1.5);

            // --- Full Conversation Section ---
            doc.fontSize(16).font('Helvetica-Bold').text('Full Conversation');
            doc.moveDown(1);

            const lines = (call.transcript || '').split('\n');
            lines.forEach((line: string) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                // Simple regex to check if line starts with a speaker label
                const speakerMatch = trimmedLine.match(/^(Customer|Agent|Caller|Replier|Person \d+|Speaker_\w+):/i);

                if (speakerMatch) {
                    const speaker = speakerMatch[1];
                    const text = trimmedLine.substring(speakerMatch[0].length).trim();

                    // Blue Bold Header for speaker
                    doc.fontSize(11).font('Helvetica-Bold').fillColor('#007bff')
                        .text(`${speaker} [00:00]:`);

                    // Black text on new line
                    doc.fillColor('#000000').font('Helvetica').text(text);
                } else {
                    doc.fillColor('#000000').fontSize(11).font('Helvetica').text(trimmedLine);
                }
                doc.moveDown(0.8);
            });

            // --- Footer (Page Numbers) ---
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('grey').text(
                    `Page ${i + 1} of ${range.count}`,
                    50,
                    doc.page.height - 30,
                    { align: 'center' }
                );
            }

            doc.end();
            logger.info('PDF generated successfully');
        } catch (error) {
            logger.error('Error generating PDF', { error });
            reject(error);
        }
    });
};
