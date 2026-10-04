// Public play always uses the deployed data; the workshop has its own local draft.
export function projectForPlay(deployed,localDraft,workshop=false){
 return structuredClone(workshop?localDraft:deployed);
}
export function draftStoreKey(release){return 'yachacha-pages-draft:'+release;}
