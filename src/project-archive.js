// Full simulator state travels with table ZIPs; Excel/Unity schemas stay unchanged.
export const PROJECT_ARCHIVE_FILE='야차차_통합프로젝트.json';
export function projectArchiveFiles(project,version){
 if(project?.format!=='YACHACHA_FULLFLOW'||!Array.isArray(project.guests)||!project.combat?.sheets)throw Error('전체 프로젝트를 받지 못해 저장을 중단했습니다. 개발실로 돌아가 다시 저장해 주세요.');
 const copy=structuredClone(project);copy.updatedAt=new Date().toISOString();
 return [{path:PROJECT_ARCHIVE_FILE,bytes:JSON.stringify(copy,null,2)},{path:'전체 대사 불러오기.txt',bytes:'버전: '+version+'\r\n커피 유령·재등장 좀비를 포함한 모든 대사, 글자 효과, 미용 설정과 사건 연결은 '+PROJECT_ARCHIVE_FILE+'에 보관했습니다.\r\n시뮬레이터 개발실의 프로젝트 불러오기에서 이 ZIP 또는 위 JSON을 선택해 주세요.\r\n작업자에게 전달할 때는 ZIP 전체 또는 JSON을 보내 주세요. 엑셀만 보내면 튜토리얼·재등장 좀비의 전용 대사 연결은 전달되지 않습니다.\r\n작업용 XLSM과 Unity용 XLSX는 기존 테이블 계약을 유지합니다. 이 JSON이 Unity 임포트 테이블이라는 뜻은 아닙니다.\r\n'}];
}
export async function readProjectArchive(file,Zip){
 let text;
 if(/\.zip$/i.test(file.name)){
  const archive=await Zip.loadAsync(await file.arrayBuffer());
  const matches=Object.values(archive.files).filter(f=>!f.dir&&f.name.split('/').at(-1)===PROJECT_ARCHIVE_FILE);
  if(matches.length!==1)throw Error(matches.length?'ZIP 안에 프로젝트가 여러 개 있습니다. 사용할 JSON 하나를 선택해 주세요.':'이 ZIP에는 전체 프로젝트 JSON이 없습니다. 이전 엑셀 ZIP에는 커피 유령·재등장 좀비 대사가 빠질 수 있습니다. 작업자의 편집 탭에서 프로젝트 파일 저장으로 JSON을 받아 주세요.');
  if(matches[0]._data?.uncompressedSize>20e6)throw Error('프로젝트 파일이 너무 큽니다.');
  text=await matches[0].async('string');
 }else text=await file.text();
 if(text.length>20e6)throw Error('프로젝트 파일이 너무 큽니다.');
 const project=JSON.parse(text.replace(/^\uFEFF/,''));
 if(project?.format!=='YACHACHA_FULLFLOW')throw Error('통합 프로젝트 JSON 또는 전체 프로젝트가 포함된 ZIP을 선택해 주세요.');
 return project;
}
