import { describe, it, expect } from 'vitest';
import { campusMajorMap } from '../data/campusMajorMap';
import { campusesForMajor } from '@/lib/campus/catalog';
import { matchesCampusPreferences } from '@/lib/campus/preferences';
const JAVA = ['DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur','Banten'];
describe('strict campus preferences',()=>{
 it.each(['PTN di Jawa','PTN luar Jawa','PTS bagus di kota besar'])('filters every major by %s before limiting',pref=>{
  for(const id of Object.keys(campusMajorMap)) {
   const r=campusesForMajor(id,{degreeTypes:pref==='PTN luar Jawa'?['D3','D4']:['S1'],preferences:[pref]});
   for(const m of r.items){
    expect(pref==='PTN luar Jawa'?['D3','D4']:['S1']).toContain(m.degree);
    expect(m.type).toBe(pref.startsWith('PTN')?'Negeri':'Swasta/Lainnya');
    if(pref.startsWith('PTN')) {expect(m.province).toBeTruthy();expect(JAVA.includes(m.province!)).toBe(pref==='PTN di Jawa');}
   }
  }
 });
 it('uses union semantics and excludes unknown regional locations',()=>{
  expect(matchesCampusPreferences({type:'Negeri'},['PTN luar Jawa'])).toBe(false);
  expect(matchesCampusPreferences({type:'Negeri',province:'DI Yogyakarta'},['PTN di Jawa','PTN luar Jawa'])).toBe(true);
  expect(matchesCampusPreferences({type:'Negeri',province:'Sumatera Utara'},['PTN di Jawa','PTN luar Jawa'])).toBe(true);
  expect(matchesCampusPreferences({type:'Swasta/Lainnya'},['PTN di Jawa','PTS bagus di kota besar'])).toBe(true);
  expect(matchesCampusPreferences({type:'Negeri',province:'Jawa Barat'},['PTS bagus di kota besar'])).toBe(false);
 });
 it('does not fabricate restrictions for unsupported preferences',()=>{
  expect(matchesCampusPreferences({type:'Swasta/Lainnya'},['Kuliah dekat rumah'])).toBe(true);
  expect(campusesForMajor('informatika',{preferences:['Belum tahu']})).toEqual(campusesForMajor('informatika'));
 });
});
