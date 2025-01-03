from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from PyPDF2 import PdfReader
import requests
from typing import Dict
import io

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/extract")
async def extract_bill_info(file: UploadFile = File(...)) -> Dict:
    try:
        # Read the uploaded PDF file
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        
        # Extract text from PDF
        reader = PdfReader(pdf_file)
        file_content = ""
        for page in reader.pages:
            file_content += page.extract_text()

        # Get API key from environment
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")

        # Prepare API request
        api_url = 'https://api.deepseek.com/chat/completions'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }

        messages = [
            {"role": "system", "content": """You are a document entity extraction specialist, receiving various waybills. Your objective is to:

1. **Adhere to the JSON Schema**  
  - The output **must** match the structure below exactly.  
  - If an entity is missing or cannot be found in the document, set its value to `null` (or an appropriate default like `0` for numbers, `false` for booleans).

2. **Extract Entities Only from the Document**  
  - Do not invent values or rely on external knowledge.  
  - Each extracted value must appear verbatim in the source document (except for minor formatting like trimming whitespace or converting dates).

3. **Tabular Data Extraction**  
  - Focus on the table (or tables) that list freight charges.  
  - Each row can only have **one** of the following payment types: `"COLLECT"` or `"PREPAID"` value. 
  - The waybill has a **single** `freight_payment_type` overall. If the waybill states `"COLLECT"`, only include line items marked or implied as **COLLECT**. If it states `"PREPAID"`, only include items marked or implied as **PREPAID**.  
  - Exclude any rows or items that do **not** match the established `freight_payment_type`."""},
            {"role": "user", "content": f"""Given a sea waybill, extract the text values of the following entities:

{{
 "bl_number": null,
 "total_cartons": 0,
 "container_size_type": null,
 "hts_code": null,
 "is_port_of_arrival_door": false,
 "place_of_delivery": null,
 "port_of_discharge": null,
 "port_of_loading": null,
 "freight_payment_type": null,
 "freight_rate_item": [
 {{
  "item_name": null,
  "amount": null,
  "currency": null
 }}
 ],
 "container_number": [],
 "seal_number": [],
 "service_contract_number": null,
 "shipped_on_board_date": null,
 "freight_charge_total": 0,
 "freight_charge_currency": "",
 "total_measurement": 0,
 "total_shipment_weight": 0
}}

{file_content}"""}
        ]

        payload = {
            "model": "deepseek-chat",
            "messages": messages,
            "temperature": 0,
            "stream": False
        }

        # Make API request
        response = requests.post(api_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        result = response.json()
        return {"result": result['choices'][0]['message']['content']}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
