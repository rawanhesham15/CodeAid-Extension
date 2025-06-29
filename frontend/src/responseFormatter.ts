class ResponseFormatter {
  getFileName(path: string): string {
    const parts = path.split(/[\\/]/);
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }

  formatSResponse(
    response: {
      file_path: string;
      violatedPrinciples: {
        principle: string;
        justification: string;
      }[];
    }[]
  ): string {
    if (response.length === 0) {
      return "<div>No SOLID Violations Found</div>";
    }
    const fileHeaderStyle = `
    font-weight: 500;
    color: #c8c8c8;
    margin-top: 10px;
    margin-bottom: 4px;
  `;

    const boxStyle = `
    background-color: #2a2d2e;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 8px;
  `;

    const titleStyle = `
    color: #12738e;
    font-weight: 500;
    margin-bottom: 4px;
  `;

    const justificationStyle = `
    color: #ccc;
    margin-left: 10px;
    margin-top: 4px;
  `;

    function getShortPath(filePath: string): string {
      const parts = filePath.split(/[\\/]/);
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }


    let html = `<div>`;

    response.forEach(({ file_path, violatedPrinciples }) => {
      html += `<div style="${fileHeaderStyle}">📄 ${getShortPath(
        file_path
      )}</div>`;
      violatedPrinciples.forEach(({ principle, justification }) => {
        html += `
          <div style="${boxStyle}">
            <div style="${titleStyle}"> ${principle}</div>
            <div style="${justificationStyle}"> ${justification}</div>
          </div>
        `;
      });
    });

    html += `</div>`;
    return html;
  }

  formatCResponse(
    response: {
      couplingSmells: {
        filesPaths: string[];
        smells: {
          smell: string;
          justification: string;
        }[];
      }[];
    }[]
  ): string {
    if (response[0].couplingSmells[0].smells.length === 0) {
      return "<div>No Coupling Smells Found</div>";
    }
    const smellBoxStyle = `
      background-color: #2a2d2e;
      border: 1px solid #555;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
    `;

    const smellTitleStyle = `
      color: #12738e;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 6px;
    `;

    const justificationStyle = `
      color: white;
      margin-top: 6px;
      margin-left: 8px;
    `;

    const fileListStyle = `
      margin-left: 15px;
      margin-top: 5px;
      color: #c8c8c8;
    `;

    function getShortPath(p: string): string {
      const parts = p.split(/[\\/]/);
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }

    let html = `<div>`;

    response.forEach(({ couplingSmells }) => {
      couplingSmells.forEach(({ filesPaths, smells }) => {
        smells.forEach(({ smell, justification }) => {
          html += `<div style="${smellBoxStyle}">
            <div style="${smellTitleStyle}"> ${smell}</div>
            <div style="${fileListStyle}">📄 Affected Files:
              <ul style="margin: 4px 0 0 20px; padding: 0;">
                ${filesPaths
              .map((fp) => `<li>${getShortPath(fp)}</li>`)
              .join("")}
              </ul>
            </div>
            <div style="${justificationStyle}"> ${justification}</div>
          </div>`;
        });
      });
    });

    html += `</div>`;
    return html;
  }

  formatSuggestionStepsResponse(
    response: {
      smell: string;
      files_involved: string[];
      suggested_steps: string[];
    }[]
  ): string {
    const smellBoxStyle = `
      background-color: #2a2d2e;
      border: 1px solid #555;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
    `;

    const smellTitleStyle = `
      color: #12738e;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 6px;
    `;

    const fileListStyle = `
      margin-left: 15px;
      margin-top: 5px;
      color: #c8c8c8;
    `;

    const stepsStyle = `
      margin-left: 20px;
      margin-top: 6px;
      color:#ffffff;
    `;

    let html = `<div>`;

    response.forEach(({ smell, files_involved, suggested_steps }) => {
      html += `<div style="${smellBoxStyle}">
        <div style="${smellTitleStyle}"> ${smell}</div>
        <div style="${fileListStyle}">📄 Files Involved:
          <ul style="margin: 4px 0 0 20px; padding: 0;">
            ${files_involved.map((file) => `<li>${file}</li>`).join("")}
          </ul>
        </div>
        <div style="${stepsStyle}"> Suggested Steps:
          <ol style="margin-top: 4px;">
            ${suggested_steps.map((step) => `<li>${step}</li>`).join("")}
          </ol>
        </div>
      </div>`;
    });

    html += `</div>`;
    return html;
  }
}
export default ResponseFormatter;
