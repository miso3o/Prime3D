// ============================================================
//  hotspots.js
//  핫스팟 위치(%) 및 카드 내용을 여기서 수정하세요.
//
//  top, left, width, height : 이미지 대비 % 값 (0~100)
//  theme : 'cim' | 'eis' | 'rms' | 'fms' | 'mes' | 'func'
//  (저장됨: 2026. 5. 28. 오후 6:34:42)
// ============================================================

const HOTSPOTS = [
{
  "id": "cim",
  "label": "① CIM — 전극공정",
  "labelEn": "① CIM — Electrode Process",
  "top": 13.66,
  "height": 22.87,
  "left": 1.13,
  "width": 32.62,
  "title": "① CIM · Computer Integrated Manufacturing.",
  "titleEn": "① CIM · Computer Integrated Manufacturing",
  "sub": "Electrode Process Management System. <br>Mixing → Coater → Press → Slitter → VacuumDryer → Winder 전극공정 라인을 담당해요.",
  "subEn": "Manages the electrode process line: Mixing → Coater → Press → Slitter → Vacuum Dryer → Winder.",
  "theme": "cim",
  "emoji": "🏗️",
  "content": [
    {
      "type": "card",
      "title": "핵심 역할",
      "titleEn": "Core Role",
      "text": "전극 공정 라인의 설비 생산정보 수집과 자재 관리를 담당해요. MES DB에 등록된 자재만 투입되도록 제어하고, 전 공정 완료 제품만 다음 공정으로 이동할 수 있도록 순서를 지켜요.",
      "textEn": "Responsible for collecting equipment production data and managing materials in the electrode process line. Controls to ensure only materials registered in the MES DB are input, and maintains process sequence so only products with all prior steps completed can move to the next process."
    },
    {
      "type": "comm-flow",
      "title": "CIM 통신 구조",
      "titleEn": "CIM Communication Architecture",
      "peers": [
        { "label": "Mixing · Coater · Press · Slitter PLC", "proto": "Melsec" },
        { "label": "Vacuum Dryer PLC × 6", "proto": "Melsec" },
        { "label": "Winder PLC × 8", "proto": "Melsec" }
      ],
      "programs": ["CIM Program 1", "CIM Program 2", "CIM Program 3"],
      "db": "MES DB",
      "dbProto": "DB Interface"
    },
    {
      "type": "card",
      "title": "⭐ 핵심 포인트",
      "titleEn": "⭐ Key Point",
      "text": "Mixer의 PD Mixer에서 BatchID 9자리가 생성돼요. 이게 전극공정의 시작점이에요!",
      "textEn": "A 9-digit BatchID is generated at the PD Mixer in the Mixer step. This is the starting point of the entire electrode process!"
    },
    {
      "type": "steps",
      "title": "전극 공정 순서",
      "titleEn": "Electrode Process Sequence",
      "rows": [
        {
          "num": 1,
          "code": "MIX",
          "name": "🧪 Mixer (incl. PD Mixer)",
          "note": "Generate 9-digit BatchID",
          "noteStyle": "key"
        },
        {
          "num": 2,
          "code": "CTR",
          "name": "Coater"
        },
        {
          "num": 3,
          "code": "PTS",
          "name": "Press"
        },
        {
          "num": 4,
          "code": "SLT",
          "name": "Slitter"
        },
        {
          "num": 5,
          "code": "VDR",
          "name": "Vacuum Dryer"
        },
        {
          "num": 6,
          "code": "WDR",
          "name": "🌀 Winder",
          "note": "→ Produce Jelly Roll",
          "noteStyle": "last"
        }
      ]
    },
    {
      "type": "card",
      "title": "설비 생산정보 수집",
      "titleEn": "Equipment Data Collection",
      "text": "CIM은 전극 공정 라인의 설비에서 발생하는 설비 상태, 생산 수량, PV/SV 값, Step Data, 검사 결과, Alarm, Warning, Event 등의 생산 정보를 실시간으로 수집해요. 수집된 데이터는 표준화되어 MES로 전달되며, 통합 생산 관리와 모니터링에 활용돼요.",
      "textEn": "CIM collects real-time production information from equipment in the electrode manufacturing line, including equipment status, production quantity, PV/SV values, step data, inspection results, alarms, warnings, and equipment events. The collected data is standardized and transferred to MES for integrated production management and monitoring."
    },
    {
      "type": "card",
      "title": "자재 관리 및 투입 제어",
      "titleEn": "Material Management",
      "image": "images/Material.png",
      "text": "CIM은 생산 라인의 자재 사용과 투입을 관리해요. MES DB에 등록된 자재만 설비에 투입할 수 있으며, 이전 공정을 완료한 제품만 다음 공정으로 이동할 수 있도록 제어해요. 이를 통해 잘못된 자재 투입을 방지하고 안정적인 생산 흐름을 유지해요.",
      "textEn": "CIM manages material usage and controls material input within the production line. Only materials registered in the MES database are allowed to be loaded into equipment, and only products that have completed the previous process can move to the next process. This control prevents incorrect material input and maintains stable production flow."
    },
    {
      "type": "card",
      "title": "이력 추적 관리",
      "titleEn": "Traceability Management",
      "text": "CIM은 생산 전 과정에서 Lot, Batch, Reel, Tray 및 공정 정보를 연결하여 Traceability를 관리해요. 공정별 생산 이력과 자재 이동 경로를 저장하여 불량 발생 시 빠른 추적과 원인 분석이 가능해요. 전극 공정에서는 PD Mixer BatchID가 전체 공정을 연결하는 핵심 Traceability 기준이 돼요.",
      "textEn": "CIM manages production traceability by connecting Lot, Batch, Reel, Tray, and process information across the entire manufacturing flow. It records production history and material movement paths for each process, allowing fast tracking and root cause analysis when defects occur. In the electrode process, the PD Mixer BatchID becomes the core traceability key that links the entire process flow."
    },
    {
      "type": "card",
      "title": "설비 인터페이스 제어",
      "titleEn": "Equipment Interface Control",
      "text": "CIM은 PLC와 통신을 통해 설비와 MES 사이의 실시간 인터페이스 제어를 수행해요. 설비 Event 처리, MES 승인 대기 로직, ACK/NACK 처리, 설비 상태 동기화 등을 관리하며, 생산 설비와 상위 시스템 간의 안정적인 통신을 지원해요.",
      "textEn": "CIM performs real-time interface control between equipment and MES through PLC communication. It processes equipment events, manages MES approval waiting logic, handles ACK/NACK responses, and synchronizes equipment status information. This allows stable and reliable communication between production equipment and upper systems."
    },
    {
      "type": "card",
      "title": "생산 흐름 제어",
      "titleEn": "Production Flow Control",
      "text": "CIM은 공정 순서를 검증하고 비정상적인 생산 흐름을 방지하여 생산 흐름을 제어해요. Lot Change 관리, 공정 조건 검증, 잘못된 공정 진행 차단 등을 수행하며, 이를 통해 안정적인 품질 유지와 생산 오류 방지를 지원해요.",
      "textEn": "CIM controls production flow by verifying process order and preventing invalid production sequences. It manages lot changes, validates process conditions, and blocks abnormal process progression when necessary. This control helps maintain stable product quality and prevents production mistakes."
    },
    {
      "type": "card",
      "title": "알람 및 이벤트 관리",
      "titleEn": "Alarm & Event Monitoring",
      "text": "CIM은 생산 중 발생하는 설비 Alarm과 Event 로그를 수집하고 저장해요. 실시간 Alarm 및 Event 정보를 운영자와 MES에 제공하여 이상 상태 모니터링, 운영 분석, 장애 대응을 지원해요.",
      "textEn": "CIM collects and stores equipment alarms and event logs generated during production. It supports abnormal status monitoring, operational analysis, and failure response by providing real-time alarm and event information to operators and MES systems."
    },
    {
      "type": "card",
      "title": "실시간 모니터링",
      "titleEn": "Real-Time Monitoring",
      "text": "CIM은 생산 라인의 설비 상태, 생산 현황, 물류 흐름, 자재 위치, 공정 진행 상황 등을 실시간으로 모니터링해요. 운영자는 통합 모니터링 화면을 통해 전체 생산 라인을 확인하고 이상 상황에 빠르게 대응할 수 있어요.",
      "textEn": "CIM provides real-time monitoring of equipment status, production conditions, logistics flow, material location, and process progress across the production line. Operators can monitor the entire manufacturing line through integrated monitoring screens and quickly respond to abnormal situations."
    },
    {
      "type": "card",
      "title": "⚠️ 서버 필수 실행",
      "titleEn": "⚠️ Server Must Be Running",
      "text": "CIM 서버가 중단되면 전극공정 설비 제어가 불가능해요! 항상 실행 상태를 유지해야 합니다.",
      "textEn": "If the CIM server goes down, electrode process equipment control becomes impossible! It must always be kept running."
    },
    {
      "type": "card",
      "wide": true,
      "title": "📖 CIM 유지보수 매뉴얼",
      "titleEn": "📖 CIM Maintenance Manual",
      "text": "이 페이지는 CIM 시스템의 핵심 개념과 역할을 간략히 소개한 내용이에요. CIM은 별도의 유지보수 매뉴얼이 있으며, CIM 담당자를 위한 문서예요. 매뉴얼에는 프로그램 설치 위치 및 설치 방법, 업데이트 절차, 주요 화면 구성, 연결된 PLC 정보 등 시스템 운영에 필요한 실무 내용이 수록되어 있으니 CIM 담당자는 반드시 확인해 주세요.",
      "textEn": "This page is a brief introduction to CIM's core concepts and role. A separate CIM maintenance manual is available for CIM administrators. The manual covers program installation locations and methods, update procedures, key screen layouts, and connected PLC information — please make sure to review it if you are responsible for CIM."
    }
  ]
},
{
  "id": "eis",
  "label": "② EIS — Assembly",
  "labelEn": "② EIS — Assembly",
  "top": 13.66,
  "height": 22.87,
  "left": 34.09,
  "width": 12.74,
  "title": "② EIS · Assembly 데이터 수집 시스템",
  "titleEn": "② EIS · Assembly Data Collection System",
  "sub": "iMES 프로그램을 통해 Assembly 16개 공정의 생산정보를 수집하고 MES DB에 저장해요.",
  "subEn": "Collects production data from all 16 Assembly processes via the iMES program and stores it in the MES DB.",
  "theme": "eis",
  "emoji": "🔬",
  "content": [
    {
      "type": "card",
      "title": "핵심 역할",
      "titleEn": "Core Role",
      "text": "iMES 프로그램을 통해 Assembly 공정 전체의 생산정보를 수집하고 MES DB에 저장해요.",
      "textEn": "Collects production data from the entire Assembly process via the iMES program and stores it in the MES DB."
    },
    {
      "type": "comm-flow",
      "title": "EIS 통신 구조",
      "titleEn": "EIS Communication Architecture",
      "peers": [
        { "label": "Assembly iMES", "sub": "각 라인 PLC 정보를 수집해 EIS로 전달", "proto": "REST API" },
        { "label": "Washing iMES", "sub": "각 라인 PLC 정보를 수집해 EIS로 전달", "proto": "REST API" }
      ],
      "programs": ["EIS Program 1", "EIS Program 2"],
      "db": "MES DB",
      "dbProto": "DB Interface"
    },
    {
      "type": "card",
      "title": "⭐ 핵심 포인트",
      "titleEn": "⭐ Key Point",
      "text": "Winder에서 생산된 젤리롤이 젤리롤 트레이를 타고 Assembly 공정(CJL)으로 투입돼요.",
      "textEn": "Jelly rolls produced by the Winder are loaded onto jelly roll trays and fed into the Assembly process (CJL)."
    },
    {
      "type": "card",
      "title": "Lot 관리",
      "titleEn": "Lot Management",
      "image": "images/Lot.png",
      "text": "Lot 13자리 단위로 LotChange가 이루어져요. Assembly의 핵심 관리 단위입니다.",
      "textEn": "LotChange is performed in 13-digit Lot units. This is the core management unit of the Assembly process."
    },
    {
      "type": "card",
      "title": "셀 ID 부여",
      "titleEn": "Cell ID Assignment",
      "image": "images/CellID.png",
      "text": "개별 셀에 셀ID 19자리가 부여되는 중요한 공정! 마지막에 트레이에 셀 400개가 담기면 위치·ID·Lot 정보를 저장해요.",
      "textEn": "An important process where each cell is assigned a 19-digit Cell ID! When 400 cells are loaded into a tray, position, ID, and Lot information are stored."
    },
    {
      "type": "steps",
      "title": "Assembly 16개 공정",
      "titleEn": "16 Assembly Processes",
      "rows": [
        {
          "num": 1,
          "code": "CJL",
          "name": "Jelly Roll Loader",
          "note": "Insert Jelly Roll and generate 13-digit Lot ID",
          "noteStyle": "key"
        },
        {
          "num": 2,
          "code": "CCI",
          "name": "Can Insert"
        },
        {
          "num": 3,
          "code": "CTW",
          "name": "Tab Welding #1"
        },
        {
          "num": 4,
          "code": "CTW",
          "name": "Tab Welding #2"
        },
        {
          "num": 5,
          "code": "CTI",
          "name": "T/I Insertion"
        },
        {
          "num": 6,
          "code": "CBD",
          "name": "Beading"
        },
        {
          "num": 7,
          "code": "CBC",
          "name": "Beading Check"
        },
        {
          "num": 8,
          "code": "CXI",
          "name": "Xray Inspection"
        },
        {
          "num": 9,
          "code": "CEF",
          "name": "EL Filling"
        },
        {
          "num": 10,
          "code": "CSW",
          "name": "Safety Vent Welding"
        },
        {
          "num": 11,
          "code": "CCR",
          "name": "Crimping"
        },
        {
          "num": 12,
          "code": "CWS",
          "name": "Washing"
        },
        {
          "num": 13,
          "code": "CTB",
          "name": "Tubing"
        },
        {
          "num": 14,
          "code": "CAI",
          "name": "Appearance Inspection"
        },
        {
          "num": 15,
          "code": "CMK",
          "name": "Marking",
          "note": "Assign 19-digit Cell ID"
        },
        {
          "num": 16,
          "code": "CPF",
          "name": "Pre-Charging & IR/OCV",
          "note": "Cell 400pcs / 1Tray → Formation Process",
          "noteStyle": "last"
        }
      ]
    },
    {
      "type": "card",
      "title": "JellyRoll Tray 투입 규칙",
      "titleEn": "JellyRoll Tray Loading Rule",
      "text": "MES의 JellyRoll TrayInformation 메뉴에서 마지막으로 투입된 Batch 목록을 확인할 수 있어요. 이전에 투입된 전극과 동일한 Batch의 젤리롤 트레이를 먼저 투입해야 해요. 잘못된 트레이가 투입되면 EIS가 설비에 NG 신호를 보내며, 작업자는 설비에서 강제 배출 또는 강제 투입으로 처리해야 합니다.",
      "textEn": "You can check the last loaded batch list in the MES JellyRoll TrayInformation menu. The jelly roll tray with the same batch as the previously loaded electrode must be loaded first. If an incorrect tray is loaded, EIS sends an NG signal to the equipment — the operator must then perform a forced discharge or forced loading from the equipment."
    },
    {
      "type": "card",
      "title": "장비 시간 동기화",
      "titleEn": "Equipment Time Synchronization",
      "text": "iMES는 하루 2회(03:00, 04:00) EIS로부터 시스템 시간을 받아 장비 시간을 동기화해요. 장비 시간이 맞지 않으면 iMES 작업 이력을 확인하세요.",
      "textEn": "iMES synchronizes equipment time by receiving system time from EIS twice a day at 03:00 and 04:00. If the equipment time is not synchronized, check the iMES work history."
    },
    {
      "type": "card",
      "title": "iMES 오프라인 데이터 전송",
      "titleEn": "iMES Offline Data Transfer",
      "text": "EIS와의 연결이 끊기면 iMES는 설비 데이터를 로컬에 저장해요. 연결이 복구된 후에는 iMES 설정에서 오프라인 데이터 전송을 활성화하고, EIS를 시작하여 오프라인 데이터를 수신하면 돼요.",
      "textEn": "If the connection with EIS is lost, iMES stores equipment data locally. Once the connection is restored, activate offline data transmission in iMES settings, then start EIS to receive the offline data."
    },
    {
      "type": "card",
      "title": "⚠️ 서버 필수 실행",
      "titleEn": "⚠️ Server Must Be Running",
      "text": "EIS 서버가 중단되면 조립공정 설비의 데이터 수집이 불가능해요! 항상 실행 상태를 유지해야 합니다.",
      "textEn": "If the EIS server goes down, data collection from assembly process equipment becomes impossible! It must always be kept running."
    },
    {
      "type": "card",
      "wide": true,
      "title": "📖 EIS 유지보수 매뉴얼",
      "titleEn": "📖 EIS Maintenance Manual",
      "text": "이 페이지는 EIS 시스템의 핵심 개념과 역할을 간략히 소개한 내용이에요. EIS는 별도의 유지보수 매뉴얼이 있으며, EIS 담당자를 위한 문서예요. 매뉴얼에는 프로그램 설치 위치 및 설치 방법, 업데이트 절차, 주요 화면 구성, 연결된 PLC 정보 등 시스템 운영에 필요한 실무 내용이 수록되어 있으니 EIS 담당자는 반드시 확인해 주세요.",
      "textEn": "This page is a brief introduction to EIS's core concepts and role. A separate EIS maintenance manual is available for EIS administrators. The manual covers program installation locations and methods, update procedures, key screen layouts, and connected PLC information — please make sure to review it if you are responsible for EIS."
    }
  ]
},
{
  "id": "fms",
  "label": "③ FMS — 물류인프라",
  "labelEn": "③ FMS — Logistics Infrastructure",
  "top": 13.66,
  "height": 22.87,
  "left": 47.26,
  "width": 20.72,
  "title": "③ FMS · 물류 인프라 관리 시스템",
  "titleEn": "③ FMS · Logistics Infrastructure Management System",
  "sub": "컨베이어·크레인·Rack 창고를 제어하는 물리적 물류 인프라 시스템이에요.",
  "subEn": "Physical logistics infrastructure system that controls conveyors, cranes, and Rack warehouses.",
  "theme": "fms",
  "emoji": "🏪",
  "content": [
    {
      "type": "card",
      "title": "🎯 FMS란?",
      "titleEn": "🎯 What is FMS?",
      "text": "FMS는 공장 내 물리적 이송 인프라를 제어하는 시스템이에요. 컨베이어 벨트로 트레이를 이동시키고, 크레인으로 Rack에 적재·불출하며, Aging Rack과 HT Aging Rack의 상태를 관리해요. RMS Scheduler와 실시간으로 통신하며 화성 공정 전체의 물류 흐름을 담당합니다.",
      "textEn": "FMS is the system that controls the physical transportation infrastructure within the factory. It moves trays via conveyor belts, loads and unloads Racks using cranes, and manages the status of Aging Racks and HT Aging Racks. It communicates in real-time with RMS Scheduler to handle the entire logistics flow of the Formation process."
    },
    {
      "type": "card",
      "title": "컨베이어 제어",
      "titleEn": "Conveyor Control",
      "text": "화성공정 전체에 깔린 컨베이어 위의 트레이 위치를 실시간으로 파악하고 이송을 제어해요.",
      "textEn": "Tracks the position of trays on conveyors throughout the entire Formation process in real-time and controls transportation."
    },
    {
      "type": "card",
      "title": "Rack 창고 관리",
      "titleEn": "Rack Warehouse Management",
      "text": "Aging Rack, HT Aging Rack의 슬롯 상태와 트레이 위치 정보를 실시간 관리해요.",
      "textEn": "Manages slot status and tray position information of Aging Racks and HT Aging Racks in real-time."
    },
    {
      "type": "card",
      "title": "RMS 연동",
      "titleEn": "RMS Integration",
      "text": "RMS Scheduler와 통신하여 공정 흐름에 맞게 물동량을 조절하고 이송 경로를 결정해요.",
      "textEn": "Communicates with RMS Scheduler to adjust material flow and determine transportation routes according to the process flow."
    },
    {
      "type": "card",
      "title": "Palletizer",
      "titleEn": "Palletizer",
      "image": "images/Palletizer.png",
      "text": "각 공정에서 배출된 Tray를 최대 4단까지 자동 적재(Stack)하여 물류 이송 단위로 구성하는 설비입니다. 4단 적재 완료 시 즉시 다음 공정으로 이송하며, 4단이 채워지지 않더라도 설정된 대기시간(기본 30분) 경과 시 현재 적재 상태로 출고합니다. 적재된 Tray는 CDC, OCV, NG Selector, Grader 등의 후속 공정 또는 Aging 공정으로 이송되며, Aging 공정은 적재 상태(Stack)를 유지한 채 투입할 수 있습니다.",
      "textEn": "The Palletizer automatically stacks trays up to four levels to create a transport unit after each production process. When four trays are stacked, they are immediately transferred to the next process. If the stack is not completed within the configured waiting time (30 minutes by default), the available trays are transferred without waiting further. Stacked trays can be sent directly to downstream processes, and Aging processes such as HT Aging can accept trays while they remain stacked."
    },
    {
      "type": "card",
      "title": "Depalletizer",
      "titleEn": "Depalletizer",
      "image": "images/Depalletizer.png",
      "text": "Palletizer에서 적재된 Tray Stack을 분리(De-Stack)하여 개별 Tray 단위로 공급하는 설비입니다. CDC, OCV, NG Selector, Grader 등 개별 Tray 투입이 필요한 공정의 입구에 설치되어 있으며, 적재된 Tray를 한 장씩 순차적으로 분리하여 공정에 투입합니다. 이를 통해 물류 구간에서는 Stack 단위로 효율적으로 이송하고, 검사 및 선별 공정에서는 개별 Tray 단위로 안정적인 공정 처리가 가능합니다.",
      "textEn": "The Depalletizer separates stacked trays and supplies them individually to the next process. It is installed at the entrance of processes such as CDC, OCV, NG Selector, and Grader, where trays must be processed one at a time. This enables efficient stack-based transportation between processes while ensuring stable single-tray handling for inspection, grading, and selection operations."
    },
    {
      "type": "card",
      "title": "Lift (리프트)",
      "titleEn": "Lift",
      "image": "images/Lift.png",
      "text": "리프트는 6층의 Assembly 라인과 7층의 Formation 라인 사이에서 트레이를 이송하는 전용 엘리베이터 설비입니다. 상행 리프트(Up Lift)는 6층에서 7층으로 트레이를 운반합니다. 이 트레이는 일반적으로 400개의 셀이 적재되어 있으며 최대 4단까지 적재된 상태로 이동하기 때문에 매우 무겁고 안전한 이송이 중요합니다. 하행 리프트(Down Lift)는 7층에서 6층으로 빈 트레이를 운반하여 Assembly 공정에 공급하며, 공장 내 트레이 순환 체계를 유지하는 역할을 수행합니다.",
      "textEn": "The Lift is a dedicated tray elevator that transfers trays between the Assembly Line on the 6th floor and the Formation Line on the 7th floor. The Up Lift transports stacked trays from the 6th floor to the 7th floor. These trays are typically loaded with 400 battery cells each and stacked up to four levels, making them extremely heavy and requiring safe and reliable transportation. The Down Lift transports empty trays from the 7th floor back to the 6th floor to supply the Assembly process, ensuring a continuous tray circulation flow throughout the factory."
    }
  ]
},
{
  "id": "rms",
  "label": "⚡ RMS — 화성공정",
  "labelEn": "⚡ RMS — Formation Process",
  "top": 13.66,
  "height": 22.87,
  "left": 68.41,
  "width": 29.85,
  "title": "⚡ RMS · 화성공정 제어 시스템",
  "titleEn": "⚡ RMS · Recipe Management System",
  "sub": "Scheduler·OCV·NGR·GRD 4개 서브 시스템으로 화성공정 전체를 실시간 수집·통제해요.",
  "subEn": "Collects and controls the entire Formation process in real-time via 4 sub-systems: Scheduler, OCV, NGR, and GRD.",
  "theme": "rms",
  "emoji": "⚡",
  "content": [
    {
      "type": "card",
      "title": "🎯 RMS란?",
      "titleEn": "🎯 What is RMS?",
      "image": "images/RMS.png",
      "text": "RMS는 화성공정의 핵심 제어 시스템이에요. 4개의 서브 시스템으로 나뉘어 각 설비와 직접 통신하며 상태를 수집·통제하고, 특히 RMS Scheduler는 FMS와 통신하며 공정 전체 흐름을 조율합니다.",
      "textEn": "RMS is the core control system for the Formation process. Divided into 4 sub-systems, it communicates directly with each piece of equipment to collect and control status. RMS Scheduler in particular communicates with FMS to coordinate the entire process flow."
    },
    {
      "type": "rms-subs",
      "subs": [
        {
          "name": "RMS Scheduler",
          "comm": "↔ FMS · CDC",
          "image": "images/BCR.png",
          "desc": "Aging Rack 상태 수집, 컨베이어 트레이 위치 추적, 공정 흐름·물동량 조절",
          "descEn": "Collects Aging Rack status, tracks conveyor tray positions, regulates process flow and material throughput"
        },
        {
          "name": "RMS OCV",
          "comm": "↔ OCV",
          "image": "images/OCV.png",
          "desc": "OCV 설비 실시간 상태 수집·통제, 셀 전압 측정 결과 MES DB 저장",
          "descEn": "Real-time collection and control of OCV equipment status, stores cell voltage measurement results in MES DB"
        },
        {
          "name": "RMS NGR",
          "comm": "↔ NG Selector",
          "image": "images/NG Selector.png",
          "desc": "NG Selector 설비 통신, 불량 셀 선별 기준 적용, 공정 품질 제어",
          "descEn": "Communicates with NG Selector equipment, applies defect cell sorting criteria, controls process quality"
        },
        {
          "name": "RMS GRD",
          "comm": "↔ Grader",
          "image": "images/Grader.png",
          "desc": "Grader 설비 통신, 셀 등급 분류 기준(Recipe) 적용, 등급 결과 저장",
          "descEn": "Communicates with Grader equipment, applies cell grading criteria (Recipe), stores grading results"
        }
      ]
    },
    {
      "type": "comm-flow",
      "title": "RMS 통신 구조",
      "titleEn": "RMS Communication Architecture",
      "peers": [
        { "label": "FMS · CDC", "proto": "REST API" },
        { "label": "OCV", "proto": "REST API" },
        { "label": "NG Selector", "proto": "REST API" },
        { "label": "Grader", "proto": "REST API" }
      ],
      "programs": ["RMS Scheduler", "RMS OCV", "RMS NGR", "RMS GRD"],
      "db": "MES DB",
      "dbProto": "DB Interface"
    },
    {
      "type": "card",
      "title": "⚠️ 서버 필수 실행",
      "titleEn": "⚠️ Server Must Be Running",
      "text": "RMS 서버가 중단되면 화성공정 설비 제어가 불가능해요! 항상 실행 상태를 유지해야 합니다.",
      "textEn": "If the RMS server goes down, Formation process equipment control becomes impossible! It must always be kept running."
    },
    {
      "type": "card",
      "wide": true,
      "title": "📖 RMS 유지보수 매뉴얼",
      "titleEn": "📖 RMS Maintenance Manual",
      "text": "이 페이지는 RMS 시스템의 핵심 개념과 역할을 간략히 소개한 내용이에요. RMS는 별도의 유지보수 매뉴얼이 있으며, RMS 담당자를 위한 문서예요. 매뉴얼에는 프로그램 설치 위치 및 설치 방법, 업데이트 절차, 주요 화면 구성, 연결된 PLC 정보 등 시스템 운영에 필요한 실무 내용이 수록되어 있으니 RMS 담당자는 반드시 확인해 주세요.",
      "textEn": "This page is a brief introduction to RMS's core concepts and role. A separate RMS maintenance manual is available for RMS administrators. The manual covers program installation locations and methods, update procedures, key screen layouts, and connected PLC information — please make sure to review it if you are responsible for RMS."
    }
  ]
},
{
  "id": "mes",
  "label": "👑 MES — 중앙 관제",
  "labelEn": "👑 MES — Central Control",
  "top": 41.86,
  "left": 42.11,
  "width": 20.14,
  "height": 19.46,
  "title": "👑 MES · Manufacturing Execution System",
  "titleEn": "👑 MES · Manufacturing Execution System",
  "sub": "모든 시스템의 중심! CIM·EIS·RMS가 수집한 데이터를 통합해 사용자에게 보여주는 통합 관제 UI예요.",
  "subEn": "The hub of all systems! An integrated control UI that consolidates data collected by CIM, EIS, and RMS and presents it to users.",
  "theme": "mes",
  "emoji": "🖥️",
  "content": [
    {
      "type": "card",
      "title": "🎯 MES란?",
      "titleEn": "🎯 What is MES?",
      "text": "MES는 보스입니다. CIM·EIS·RMS·FMS가 각자의 역할을 수행하며 MES DB에 데이터를 채워주면, MES는 이 모든 정보를 취합해 사용자가 보기 쉽게 화면에 보여주는 통합 사용자 인터페이스예요.",
      "textEn": "MES is the boss. When CIM, EIS, RMS, and FMS each perform their roles and fill the MES DB with data, MES aggregates all this information and presents it in an integrated user interface that is easy for users to view."
    },
    {
      "type": "card",
      "title": "주요 기능",
      "titleEn": "Key Features",
      "text": "데이터 통합 시각화 · 자재 등록·관리 · 공정 정보 조회",
      "textEn": "Integrated data visualization · Material registration & management · Process information inquiry"
    },
    {
      "type": "card",
      "title": "⚠️ 주의사항",
      "titleEn": "⚠️ Important Notes",
      "text": "CIM·EIS·RMS 서버가 모두 정상 실행 중이어야 MES가 올바르게 데이터를 수집·표시할 수 있어요!",
      "textEn": "All CIM, EIS, and RMS servers must be running normally for MES to correctly collect and display data!"
    },
    {
      "type": "card",
      "wide": true,
      "title": "📖 MES UI 매뉴얼",
      "titleEn": "📖 MES UI Manual",
      "text": "이 페이지는 MES의 역할과 핵심 기능을 간략히 소개한 내용이에요. MES는 별도의 UI 매뉴얼이 있으며, MES 화면을 실제로 사용하는 분들을 위한 문서예요. 매뉴얼에는 각 화면별 기능 설명, 버튼 및 메뉴 사용법, 데이터 조회·등록 방법 등 MES UI 전반에 걸친 상세 가이드가 수록되어 있으니 꼭 참고해 주세요.",
      "textEn": "This page is a brief introduction to MES's role and key features. A separate MES UI manual is available for users who work with the MES screens directly. The manual includes detailed guides covering each screen's features, button and menu usage, and data inquiry and registration procedures — please be sure to refer to it."
    }
  ]
},
{
  "id": "f1",
  "label": "① 설비 상태 모니터링",
  "labelEn": "① Equipment Status Monitoring",
  "top": 42,
  "height": 19,
  "left": 1.65,
  "width": 11.57,
  "title": "① 설비 상태 모니터링",
  "titleEn": "① Equipment Status Monitoring",
  "sub": "전극·Assembly·화성 공정의 설비 가동 상태를 실시간으로 수집해요.",
  "subEn": "Collects real-time operating status of equipment across the Electrode, Assembly, and Formation processes.",
  "theme": "func",
  "emoji": "🤖",
  "content": [
    {
      "type": "card",
      "title": "설비 상태 모니터링",
      "titleEn": "Equipment Status Collection",
      "text": "CIM·EIS·RMS가 각 공정 설비의 가동 상태(운전·대기·알람·오류)를 실시간으로 수집하여 MES DB에 저장해요. MES 화면에서 전체 라인의 설비 상태를 한눈에 모니터링할 수 있어요.",
      "textEn": "CIM, EIS, and RMS collect the operating status (running, standby, alarm, error) of each process equipment in real-time and store it in the MES DB. The status of all line equipment can be monitored at a glance on the MES screen."
    },
    {
      "type": "card",
      "title": "수집 주기",
      "titleEn": "Collection Frequency",
      "text": "실시간(이벤트 기반) 수집으로 설비 이상 발생 즉시 MES에 반영돼요.",
      "textEn": "With real-time (event-based) collection, equipment abnormalities are immediately reflected in MES."
    }
  ]
},
{
  "id": "f2",
  "label": "② 생산 데이터 수집",
  "labelEn": "② Production Data Collection",
  "top": 42,
  "height": 19,
  "left": 13.67,
  "width": 9.5,
  "title": "② 생산 데이터 수집",
  "titleEn": "② Production Data Collection",
  "sub": "설비의 상세 장비 파라미터·상태값을 주기적으로 수집해요.",
  "subEn": "Periodically collects detailed device parameters and status values from equipment.",
  "theme": "func",
  "emoji": "⏱️",
  "content": [
    {
      "type": "card",
      "title": "생산 데이터 수집",
      "titleEn": "Production Data Collection",
      "text": "CIM은 전극공정 설비의 생산 데이터를, EIS는 Assembly공정의 생산 데이터를, RMS는 화성공정 설비 데이터를 수집해요. MES는 각 시스템에서 수집된 생산량, PV/SV, Step Data, 검사 결과 등의 데이터를 통합 관리하며 생산 이력 및 품질 분석의 기초 데이터로 활용해요.",
      "textEn": "CIM collects production data from Electrode process equipment, EIS collects production data from Assembly processes, and RMS collects data from Formation process equipment. MES integrates and manages production quantity, PV/SV, Step Data, and inspection results collected from each system, utilizing them as fundamental data for production history management and quality analysis."
    },
    {
      "type": "card",
      "title": "수집 항목",
      "titleEn": "Collected Parameters",
      "text": "온도, 압력, 속도, 전류, 전압 등 설비별 핵심 파라미터. 공정별로 수집되는 상세 데이터는 설비와 공정 특성에 따라 달라요.",
      "textEn": "Key parameters per equipment: temperature, pressure, speed, current, voltage, etc. The detailed data collected for each process varies depending on the equipment and process characteristics."
    }
  ]
},
{
  "id": "f3",
  "label": "③ 트레이 위치 추적",
  "labelEn": "③ Tray Location Tracking",
  "top": 42,
  "height": 19,
  "left": 23.41,
  "width": 9.5,
  "title": "③ 트레이 위치 추적",
  "titleEn": "③ Tray Location Tracking",
  "sub": "FMS와 RMS Scheduler가 컨베이어 위의 트레이 위치를 실시간 추적해요.",
  "subEn": "FMS and RMS Scheduler track tray positions on the conveyor in real-time.",
  "theme": "func",
  "emoji": "📍",
  "content": [
    {
      "type": "card",
      "title": "트레이 위치 추적",
      "titleEn": "Tray Location Tracking",
      "text": "화성공정 전체에 깔린 컨베이어 위의 트레이 위치를 RMS Scheduler가 실시간으로 수집해요. 어떤 트레이가 어느 위치에 있는지, Aging Rack의 어느 슬롯에 보관 중인지를 MES에서 조회할 수 있어요.",
      "textEn": "RMS Scheduler collects the position of trays on conveyors throughout the entire Formation process in real-time. MES allows you to query which tray is at which position and in which slot of the Aging Rack it is stored."
    },
    {
      "type": "card",
      "title": "트레이 단위",
      "titleEn": "Tray Unit",
      "text": "셀 400개가 담긴 트레이를 기본 단위로 위치를 추적해요. 최초 EIS가 저장한 셀-위치 정보와 연동되며, 이후 FMS 및 각 공정장비의 셀 정보 이동에 따라 위치가 업데이트됩니다.",
      "textEn": "Position tracking uses a tray containing 400 cells as the basic unit. It is linked with the cell-position information initially stored by EIS, and the location is subsequently updated according to cell information transfers by FMS and each process equipment."
    }
  ]
},
{
  "id": "f4",
  "label": "④ 공정 관리",
  "labelEn": "④ Process Management",
  "top": 42,
  "height": 19,
  "left": 32.91,
  "width": 9,
  "title": "④ 공정 관리",
  "titleEn": "④ Process Management",
  "sub": "공정 진행 상태를 관리하고 공정 조건 및 생산 흐름을 제어해요.",
  "subEn": "Manages process status and controls process conditions and production flow.",
  "theme": "func",
  "emoji": "📋",
  "content": [
    {
      "type": "card",
      "title": "공정 관리",
      "titleEn": "Process Management",
      "text": "CIM은 전극공정, EIS는 Assembly공정, RMS는 화성공정의 공정 흐름을 관리해요. MES는 각 시스템의 공정 진행 정보를 통합하여 공정 상태, 공정 조건 및 생산 흐름을 관리하며 안정적인 생산 운영을 지원해요.",
      "textEn": "CIM manages Electrode processes, EIS manages Assembly processes, and RMS manages Formation process flows. MES integrates process progress information from each system to manage process status, process conditions, and production flow, supporting stable manufacturing operations."
    }
  ]
},
{
  "id": "f5",
  "label": "⑤ 품질 관리",
  "labelEn": "⑤ Quality Management",
  "top": 42,
  "height": 19,
  "left": 62.27,
  "width": 11,
  "title": "⑤ 품질 관리",
  "titleEn": "⑤ Quality Management",
  "sub": "검사 데이터 및 품질 정보를 수집하여 품질 상태를 관리해요.",
  "subEn": "Collects inspection and quality data to manage product quality status.",
  "theme": "func",
  "emoji": "📋",
  "content": [
    {
      "type": "card",
      "title": "품질 관리",
      "titleEn": "Quality Management",
      "text": "검사 설비 및 공정에서 발생하는 품질 데이터는 각 시스템을 통해 MES로 수집돼요. RMS Ocv는 OCV 검사 데이터를, RMS Ngr는 NG 판정 데이터를, RMS Grd는 Grade 판정 데이터를 관리하며, MES는 이를 통합하여 품질 상태를 실시간으로 모니터링하고 이력 추적 및 원인 분석을 수행해요.",
      "textEn": "Quality data generated from inspection equipment and production processes is collected into MES through each system. RMS Ocv manages OCV inspection data, RMS Ngr manages NG judgment data, and RMS Grd manages grade classification data. MES integrates this information to monitor quality status in real time and perform traceability and root cause analysis."
    }
  ]
},
{
  "id": "f6",
  "label": "⑥ 레시피 관리",
  "labelEn": "⑥ Recipe Management",
  "top": 42,
  "height": 19,
  "left": 73,
  "width": 11.57,
  "title": "⑥ 레시피 관리",
  "titleEn": "⑥ Recipe Management",
  "sub": "공정별 Recipe를 등록·관리하고 설비에 배포해요.",
  "subEn": "Registers and manages per-process Recipes and distributes them to equipment.",
  "theme": "func",
  "emoji": "📖",
  "content": [
    {
      "type": "card",
      "title": "레시피 관리",
      "titleEn": "Recipe Management",
      "text": "각 공정 설비에서 사용할 Recipe(공정 조건·파라미터 세트)를 MES에서 등록·관리해요. RMS는 이 Recipe 정보를 바탕으로 화성공정의 흐름과 셀 평가 기준을 조정합니다.",
      "textEn": "Registers and manages the Recipe (set of process conditions and parameters) to be used by each process equipment in MES. RMS adjusts the Formation process flow and cell evaluation criteria based on this Recipe information."
    },
    {
      "type": "card",
      "title": "관리 기능",
      "titleEn": "Management Features",
      "text": "Recipe 버전 관리, 변경 이력 추적, 설비별 배포 이력을 MES에서 확인할 수 있어요.",
      "textEn": "Recipe version management, change history tracking, and equipment-specific deployment history can all be checked in MES."
    }
  ]
},
{
  "id": "f7",
  "label": "⑦ Traceability",
  "labelEn": "⑦ Traceability",
  "top": 42,
  "height": 19,
  "left": 84.7,
  "width": 12.22,
  "title": "⑦ Traceability",
  "titleEn": "⑦ Traceability",
  "sub": "BatchID·LotID·셀ID를 통해 제품의 전체 생산 이력을 추적해요.",
  "subEn": "Tracks the complete production history of products via BatchID, LotID, and Cell ID.",
  "theme": "func",
  "emoji": "🔎",
  "content": [
    {
      "type": "card",
      "wide": true,
      "title": "추적성이란?",
      "titleEn": "What is Traceability?",
      "text": "배터리 셀의 원자재, 공정 흐름, 설비, 검사 결과까지 전체 이력을 언제든지 추적할 수 있어요. CIM이 생성한 BatchID, EIS가 부여한 LotID, 전체 공정에 연결되는 Cell ID를 통해 완전한 추적 체계를 구축해요.",
      "textEn": "The complete history of a battery cell — including raw materials, process flow, equipment, and inspection results — can be tracked at any time. A complete tracking system is established through BatchID generated by CIM, LotID assigned by EIS, and Cell ID linked throughout production."
    },
    {
      "type": "card",
      "title": "왜 중요한가요?",
      "titleEn": "Why It Matters",
      "text": "불량 발생 시 영향을 받은 Batch와 Lot를 즉시 식별하여 관련 셀을 빠르게 격리할 수 있어요. 추적성은 품질 리스크를 최소화하고 신속한 원인 분석을 가능하게 해요.",
      "textEn": "When a defect occurs, the affected Batch and Lot can be identified immediately to isolate all related cells. Traceability minimizes quality risks and enables fast root-cause analysis."
    },
    {
      "type": "card",
      "title": "Lot 표준 관리",
      "titleEn": "Lot Standard",
      "text": "정확한 추적성은 엄격한 Lot 표준 준수에서 시작돼요. 모든 공정은 정의된 Lot 생성 및 이관 규칙을 따라야 하며, 하나의 Tray에는 하나의 Lot만 존재해야 해요. Lot Change는 반드시 지정된 공정 시점에 수행되어야 해요.",
      "textEn": "Accurate Traceability begins with strict Lot Standard compliance. Every process must follow the defined Lot generation and transfer rules. One Tray must contain only one Lot. Lot Change must be performed at the correct process timing."
    },
    {
      "type": "card",
      "title": "Electrode Lot 표준",
      "titleEn": "Electrode Lot Standard",
      "wide": true,
      "inlineImage": "images/Electrode_Lot.png"
    },
    {
      "type": "card",
      "title": "Assembly Lot 표준",
      "titleEn": "Assembly Lot Standard",
      "wide": true,
      "inlineImage": "images/Assembly_Lot.png"
    },
    {
      "type": "steps",
      "title": "공정 연계성",
      "titleEn": "Process Connectivity",
      "rows": [
        {
          "num": 1,
          "code": "MIX",
          "name": "PD Mixer",
          "note": "BatchID 생성",
          "noteStyle": "key"
        },
        {
          "num": 2,
          "code": "WDR",
          "name": "Winder",
          "note": "Jelly Roll + Batch 정보 이송"
        },
        {
          "num": 3,
          "code": "EIS",
          "name": "Assembly",
          "note": "LotID · Cell ID 부여",
          "noteStyle": "key"
        },
        {
          "num": 4,
          "code": "RMS",
          "name": "Formation & OCV",
          "note": "이전 생산 이력 전체 계승",
          "noteStyle": "last"
        }
      ]
    },
    {
      "type": "card",
      "title": "추적 대상",
      "titleEn": "Tracking Targets",
      "text": "시스템은 생산 관련 모든 정보를 지속적으로 추적해요.<br>원자재 · BatchID · LotID · Cell ID · Tray ID · 설비 이력 · 공정 데이터 · 레시피 정보 · 검사 결과",
      "textEn": "The system continuously tracks all production-related information.<br>Raw Material · BatchID · LotID · Cell ID · Tray ID · Equipment History · Process Data · Recipe Information · Inspection Result"
    },
    {
      "type": "card",
      "title": "작업자 확인 사항",
      "titleEn": "Operator Checkpoint",
      "text": "• 모든 Tray와 자재는 이송 전에 반드시 스캔되어야 해요.<br>• 공정 투입 전 Lot 일치 여부를 반드시 확인해야 해요.<br>• 서로 다른 Lot를 동일 Tray에 혼입하면 안 돼요.<br>• 잘못된 Lot Change는 전체 생산 이력 체계를 무너뜨릴 수 있어요.",
      "textEn": "• All trays and materials must be scanned before transfer.<br>• Operators must verify Lot consistency before process input.<br>• Different Lots must never be mixed in the same tray.<br>• Incorrect Lot Change may break the entire production history chain."
    },
    {
      "type": "card",
      "title": "MES / FMS 제어",
      "titleEn": "MES / FMS Control",
      "text": "• 유효하지 않은 자재 이동은 자동으로 차단돼요.<br>• Lot 불일치 발생 시 즉시 NG 알람이 발생해요.<br>• Tray 이동 정보는 실시간으로 추적돼요.<br>• 모든 생산 이력은 시스템에 지속적으로 저장돼요.",
      "textEn": "• Invalid material transfer is blocked automatically.<br>• Lot mismatch generates immediate NG alarms.<br>• Tray movement is tracked in real time.<br>• All production history is stored continuously in the system."
    },
    {
      "type": "steps",
      "title": "역추적 흐름",
      "titleEn": "Reverse Trace Flow",
      "rows": [
        {
          "num": 1,
          "code": "ID",
          "name": "Cell ID"
        },
        {
          "num": 2,
          "code": "↓",
          "name": "Lot ID"
        },
        {
          "num": 3,
          "code": "↓",
          "name": "Batch ID"
        },
        {
          "num": 4,
          "code": "↓",
          "name": "Raw Material / 원자재"
        }
      ]
    },
    {
      "type": "card",
      "title": "추적성이 무너지면",
      "titleEn": "When Traceability Fails",
      "text": "잘못된 Lot 관리는 심각한 생산 및 품질 문제를 유발해요.<br>• 생산 이력 혼입 · 잘못된 품질 분석 · NG 격리 실패 · 리콜 범위 확대 · 생산 신뢰성 저하",
      "textEn": "Incorrect Lot handling may cause serious production and quality issues.<br>• Mixed production history · Wrong quality analysis · NG isolation failure · Expanded recall range · Loss of production reliability"
    },
    {
      "type": "card",
      "title": "추적성 핵심 원칙",
      "titleEn": "Traceability Rule",
      "text": "Lot 표준 준수 없이는 추적성을 보장할 수 없어요. 단 한 번의 잘못된 Lot Change가 전체 이력 체계를 무너뜨릴 수 있어요. 모든 Cell은 자신의 생산 이력을 가지고 있어야 해요.",
      "textEn": "No Traceability without Lot Standard compliance. One wrong Lot Change can break the entire history chain. Every Cell must know where it came from."
    }
  ]
},
{
  "id": "f8",
  "label": "⑧ Rack 재고 관리",
  "labelEn": "⑧ Rack Inventory Management",
  "top": 62,
  "height": 17,
  "left": 2.26,
  "width": 11.56,
  "title": "⑧ Rack 재고 관리",
  "titleEn": "⑧ Rack Inventory Management",
  "sub": "Aging Rack·HT Aging Rack의 슬롯별 재고 현황을 관리해요.",
  "subEn": "Manages per-slot inventory status of Aging Racks and HT Aging Racks.",
  "theme": "func",
  "emoji": "🗄️",
  "content": [
    {
      "type": "card",
      "title": "Rack 재고 관리",
      "titleEn": "Rack Inventory Management",
      "text": "화성공정의 Aging Rack과 HT Aging Rack에 보관 중인 트레이·셀 재고를 슬롯 단위로 관리해요. RMS Scheduler가 FMS와 통신하며 Rack 상태를 실시간 수집하고, MES에서 전체 재고 현황을 조회할 수 있어요.",
      "textEn": "Manages tray and cell inventory stored in the Aging Rack and HT Aging Rack of the Formation process on a slot-by-slot basis. RMS Scheduler communicates with FMS to collect Rack status in real-time, and the overall inventory status can be viewed in MES."
    },
    {
      "type": "card",
      "title": "관리 정보",
      "titleEn": "Managed Information",
      "text": "슬롯별 적재 여부, 트레이 ID, 투입 시간, 목표 Aging 시간, 잔여 시간 등을 관리해요.",
      "textEn": "Manages per-slot loading status, tray ID, input time, target Aging time, remaining time, and more."
    }
  ]
},
{
  "id": "f9",
  "label": "⑨ Aging 관리",
  "labelEn": "⑨ Aging Management",
  "top": 62,
  "height": 17,
  "left": 14.22,
  "width": 12.89,
  "title": "⑨ Aging 관리",
  "titleEn": "⑨ Aging Management",
  "sub": "셀의 Aging 시간·온도 조건을 관리하고 완료 여부를 판정해요.",
  "subEn": "Manages Aging time and temperature conditions for cells and determines completion.",
  "theme": "func",
  "emoji": "⏰",
  "content": [
    {
      "type": "card",
      "title": "Aging 관리",
      "titleEn": "Aging Management",
      "text": "Aging은 셀을 일정 시간·온도 조건에서 보관해 안정화하는 공정이에요. RMS Scheduler가 Aging Rack 내 트레이의 투입 시간과 목표 시간을 관리하고, 완료 시 FMS를 통해 다음 공정으로 불출해요.",
      "textEn": "Aging is a process that stabilizes cells by storing them under specific time and temperature conditions. RMS Scheduler manages the input time and target time of trays in the Aging Rack, and upon completion, discharges them to the next process via FMS."
    },
    {
      "type": "card",
      "wide": true,
      "title": "Aging 종류",
      "titleEn": "Aging Types",
      "text": "일반 Aging Rack과 HT(고온) Aging Rack 두 종류로 운영돼요.",
      "textEn": "Operated in two types: standard Aging Rack and HT (High Temperature) Aging Rack."
    },
    {
      "type": "card",
      "title": "일반 Aging Rack",
      "titleEn": "Standard Aging Rack",
      "image": "images/Aging.png",
      "text": "말 그대로 창고용 Rack이에요. <br>① Assembly에서 막 만들어진 배터리를 24시간 동안 상온 보관하거나, <br>② 고온 Aging(HT) 공정을 마친 셀을 출하 전 상온으로 서서히 냉각·안정화할 때 사용해요. <br>빈 트레이 보관 목적으로도 활용됩니다.",
      "textEn": "Essentially a storage rack. Used for: <br>① storing freshly assembled batteries at room temperature for 24 hours, or <br>② gradually cooling and stabilizing cells after HT Aging before shipment. <br>Also used to store empty trays."
    },
    {
      "type": "card",
      "title": "🌡️ HT Aging (고온 Aging)",
      "titleEn": "🌡️ HT Aging (High Temperature)",
      "image": "images/HT Aging.png",
      "text": "45°C의 고온을 유지하는 공정 기기예요. 단순 보관이 아닌 품질 확보를 위한 핵심 공정으로, <br>① 전해액이 셀 내부 구석구석에 잘 퍼지고 <br>② SEI(고체 전해질 계면) 화학반응이 안정화되며 <br>③ 미세 쇼트·불량 셀이 빠르게 드러나요. <br>그 결과 전압 이상·자가방전·발열 같은 잠재적 결함을 출하 전에 조기 검출할 수 있어요.",
      "textEn": "A process unit maintained at 45°C — not simple storage, but a critical quality assurance step. It ensures <br>① electrolyte spreads thoroughly inside the cell, <br>② SEI (Solid Electrolyte Interphase) chemical reactions stabilize, and <br>③ micro-shorts and defective cells are revealed quickly. <br>This allows early detection of voltage anomalies, self-discharge, and heat generation before shipment."
    }
  ]
},
{
  "id": "f10",
  "label": "⑩ 물동량 관리",
  "labelEn": "⑩ Material Flow Management",
  "top": 62,
  "height": 17,
  "left": 28,
  "width": 12.85,
  "title": "⑩ 물동량 관리",
  "titleEn": "⑩ Material Flow Management",
  "sub": "로터리 컨베이어의 트레이 흐름과 물동량을 조절해요.",
  "subEn": "Regulates tray flow and material throughput on the rotary conveyor.",
  "theme": "func",
  "emoji": "🔄",
  "content": [
    {
      "type": "card",
      "title": "물동량 관리",
      "titleEn": "Material Flow Management",
      "image": "images/Routing.png",
      "text": "화성공정의 로터리 컨베이어 위를 이동하는 트레이의 물동량을 RMS Scheduler가 조절해요. 각 공정 설비의 처리 속도와 Rack 잔여 용량을 고려해 최적의 흐름을 유지합니다.",
      "textEn": "RMS Scheduler regulates the material flow of trays moving on the rotary conveyor of the Formation process. It maintains optimal flow by considering the processing speed of each process equipment and remaining Rack capacity."
    }
  ]
},
{
  "id": "f11",
  "label": "⑪ 공정 순서 관리",
  "labelEn": "⑪ Process Sequence Control",
  "top": 62,
  "height": 17,
  "left": 41.32,
  "width": 13.74,
  "title": "⑪ 공정 순서 관리",
  "titleEn": "⑪ Process Sequence Control",
  "sub": "제품이 정해진 공정 순서를 따라 이동하도록 제어해요.",
  "subEn": "Controls product movement to follow the defined process sequence.",
  "theme": "func",
  "emoji": "📝",
  "content": [
    {
      "type": "card",
      "title": "공정 순서 관리",
      "titleEn": "Process Sequence Control",
      "text": "CIM·EIS·RMS가 각각 전극·Assembly·화성 공정의 순서를 제어해요. 전 공정이 완료된 제품만 다음 공정으로 이동할 수 있고, 순서를 건너뛰는 것을 방지합니다.",
      "textEn": "CIM, EIS, and RMS each control the sequence of the Electrode, Assembly, and Formation processes. Only products with all prior processes completed can move to the next process, preventing sequence skipping."
    },
    {
      "type": "card",
      "title": "제어 원칙",
      "titleEn": "Control Principle",
      "text": "이전 공정 완료 여부를 MES DB에서 확인한 후에만 다음 공정 투입을 허가해요.",
      "textEn": "Input into the next process is only permitted after confirming completion of the previous process in the MES DB."
    },
    {
      "type": "card",
      "title": "Prime Process Step",
      "titleEn": "Prime Process Step",
      "wide": true,
      "inlineImage": "images/ProcessStep.png"
    }
  ]
},
{
  "id": "f12",
  "label": "⑫ 자재 관리",
  "labelEn": "⑫ Material Management",
  "top": 62,
  "height": 17,
  "left": 55.74,
  "width": 13.19,
  "title": "⑫ 자재 관리",
  "titleEn": "⑫ Material Management",
  "sub": "MES DB에 등록된 자재만 공정에 투입될 수 있도록 관리해요.",
  "subEn": "Ensures only materials registered in the MES DB can be input into the process.",
  "theme": "func",
  "emoji": "📦",
  "content": [
    {
      "type": "card",
      "title": "자재 관리",
      "titleEn": "Material Management",
      "text": "배터리 생산에 사용되는 원자재·부자재를 MES에서 등록·관리해요. CIM은 MES DB에 등록된 자재만 전극공정에 투입되도록 제어합니다. 미등록 자재는 자동으로 차단되어 추적 불가능한 자재의 사용을 방지해요.",
      "textEn": "Raw materials and subsidiary materials used in battery production are registered and managed in MES. CIM controls to ensure only materials registered in the MES DB are input into the electrode process. Unregistered materials are automatically blocked to prevent the use of untraceable materials."
    },
    {
      "type": "card",
      "title": "투입 제어",
      "image": "images/Material.png",
      "titleEn": "Input Control",
      "text": "MES DB 등록 여부 확인 → 공정 적합성 확인 → 투입 승인의 3단계 검증을 거쳐요.",
      "textEn": "A 3-step verification is performed: MES DB registration check → process suitability check → input approval."
    }
  ]
},
{
  "id": "f13",
  "label": "⑬ 설비 모니터링",
  "labelEn": "⑬ Equipment Monitoring",
  "top": 62,
  "height": 17,
  "left": 69.93,
  "width": 13.85,
  "title": "⑬ 설비 모니터링",
  "titleEn": "⑬ Equipment Monitoring",
  "sub": "전체 공정 라인의 설비 상태를 실시간으로 모니터링해요.",
  "subEn": "Monitors equipment status across the entire process line in real-time.",
  "theme": "func",
  "emoji": "📡",
  "content": [
    {
      "type": "card",
      "title": "설비 모니터링",
      "titleEn": "Equipment Monitoring",
      "text": "MES 화면에서 전 공정(전극·Assembly·화성) 설비의 가동 상태, 생산량, 알람을 실시간으로 확인할 수 있어요. CIM·EIS·RMS가 수집한 설비 상태 데이터를 MES가 취합해 시각적으로 보여줍니다.",
      "textEn": "The operating status, production volume, and alarms of all process (Electrode, Assembly, Formation) equipment can be checked in real-time on the MES screen. MES aggregates equipment status data collected by CIM, EIS, and RMS and displays it visually."
    }
  ]
},
{
  "id": "f14",
  "label": "⑭ 생산 데이터 관리",
  "labelEn": "⑭ Production Data Management",
  "top": 62,
  "height": 17,
  "left": 84.46,
  "width": 12.44,
  "title": "⑭ 생산 데이터 관리",
  "titleEn": "⑭ Production Data Management",
  "sub": "생산 및 설비 데이터를 저장, 조회, 분석할 수 있도록 통합 관리해요.",
  "subEn": "Integrates and manages production and equipment data for storage, inquiry, and analysis.",
  "theme": "func",
  "emoji": "🗃️",
  "content": [
    {
      "type": "card",
      "title": "생산 데이터 관리",
      "titleEn": "Production Data Management",
      "text": "CIM, EIS, RMS에서 수집한 생산 및 설비 데이터는 MES DB에 통합 저장돼요. 저장된 데이터는 생산 이력 조회, 운영 분석, 품질 추적 및 시스템 연계 데이터로 활용되며, 전체 생산 공정의 통합 데이터 기반을 구성해요.",
      "textEn": "Production and equipment data collected from CIM, EIS, and RMS are centrally stored in the MES database. The stored data is used for production history inquiries, operational analysis, quality traceability, and system integration, forming the integrated data foundation of the entire manufacturing process."
    }
  ]
},
{
  "id": "img_MES",
  "label": "MES",
  "top": 80.97,
  "height": 16.22,
  "left": 1.13,
  "width": 8,
  "image": "images/MES.png"
},
{
  "id": "img_CIM",
  "label": "CIM",
  "top": 80.97,
  "height": 16.22,
  "left": 28.77,
  "width": 11.54,
  "image": "images/CIM.png"
},
{
  "id": "img_EIS",
  "label": "EIS",
  "top": 80.97,
  "height": 16.22,
  "left": 40,
  "width": 11.54,
  "image": "images/EIS.png"
},
{
  "id": "img_CDC",
  "label": "CDC",
  "top": 80.97,
  "height": 16.22,
  "left": 64.07,
  "width": 6.73,
  "image": "images/CDC.png"
},
{
  "id": "img_OCV",
  "label": "OCV",
  "top": 80.78,
  "height": 16.22,
  "left": 71.86,
  "width": 7.12,
  "image": "images/OCV.png"
},
{
  "id": "img_NGR",
  "label": "NGR",
  "top": 80.78,
  "height": 16.22,
  "left": 79.91,
  "width": 7.89,
  "image": "images/NG Selector.png"
},
{
  "id": "img_GRD",
  "label": "GRD",
  "top": 81.36,
  "height": 15.83,
  "left": 88.49,
  "width": 8.41,
  "image": "images/Grader.png"
}
];
