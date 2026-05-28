import fs from 'fs';
import Papa from 'papaparse';
import crypto from 'crypto';

const csvPeople = `id,Autonumber,full_name,nickname,birth,death,gender,mobile_1,mobile_2,mail id,coordinates,postal_address,blood_group,photo_tags
P001,1,Giri Prasath S P,,25/12/1995,,male,+917904801792,+91994317835,giriprasath51@gmail.com,,,O+,
P002,2,Madhumitha P,,15/8/1996,,female,+917373556652,,madhumithap1996@gmail.com,,,AB+,
P003,3,Palanisamy S,,10/9/1961,,male,+919442817835,+918675965835,sps.sivagiri@gmail.com,,,B+,
P004,4,Mohanambal P,,2/10/1975,,female,+91 97912 73835,+91 94888 35650,,,,,,
P005,5,Palanisamy K A,,6/3/1963,,male,+91 99656 20252,(830) 066-1252,,"11.230550901146248, 77.82375460695765",,A+,
P006,6,Rajeshwari P,Chinna Mani,27/9/1973,,female,+91 95005 42523,,,,,B+,
P007,7,Songappan,Solakarar,,20/12/1996,male,,,,,,,,
P008,8,Lakshmi,,,,female,96269 95440,,,,,,,
P009,9,Ponnusamy,,,,male,,,,,,,,
P010,10,Thangammal,,,,female,(948) 883-8135,,,"11.230550901146248, 77.82375460695765",,,,
P011,11,Naveen P,,19/1/1998,,male,(876) 087-5700,+44 7833 824823,,,,,
P012,12,Nivedha S,,,,female,,,,,,,,
P013,13,Surya Prasath S P,ShuChu,,,male,+91 90805 92760,+91 94866 09650,,,,,,
P014,14,Somasundaram P,,,,male,,,,,Perundurai,,,
P015,15,Sumadhi C,,,,female,,,,,,,,
P016,16,Parvathi,,,,female,,,,,,,,
P017,17,Rajamanikam,,,,male,,,,,,,,
P018,18,Dhiyaneshwaran,,,,male,+91 99441 22889,,,,,,,,
P019,19,Indhu,,,,female,,,,,,,,
P020,20,Dhiyanesh son,,,,male,,,,,,,,
P021,21,Attai 1,,,,female,,,,,,,,
P022,22,Attai 2,,,,female,,,,,,,,
P023,23,,,,,,,,,,,,`;

const csvRel3 = `id,id copy,Autonumber,person_1_id,full_name (from person_1_id) 2,relationship_type,person_2_id,full_name (from person_2_id)
R2001,R2001,1,P002,Madhumitha P,married_to,P001,Giri Prasath S P
R2002,R2002,2,P004,Mohanambal P,married_to,P003,Palanisamy S
R2003,R2003,3,P006,Rajeshwari P,married_to,P005,Palanisamy K A
R2004,R2004,4,P003,Palanisamy S,parent_of,P001,Giri Prasath S P
R2005,R2005,5,P005,Palanisamy K A,parent_of,P002,Madhumitha P
R2006,R2006,6,P008,Lakshmi,married_to,P007,Songappan
R2007,R2007,7,P010,Thangammal,married_to,P009,Ponnusamy
R2008,R2008,8,P012,Nivedha S,married_to,P011,Naveen P
R2009,R2009,9,P015,Sumadhi C,married_to,P014,Somasundaram P
R2010,R2010,10,P014,Somasundaram P,parent_of,P012,Nivedha S
R2011,R2011,11,P007,Songappan,parent_of,P003,Palanisamy S
R2012,R2012,12,P009,Ponnusamy,parent_of,P004,Mohanambal P
R2013,R2013,13,P001,Giri Prasath S P,sibling_of,P013,Surya Prasath S P
R2014,R2014,14,P013,Surya Prasath S P,sibling_of,P001,Giri Prasath S P
R2015,R2015,15,P002,Madhumitha P,sibling_of,P011,Naveen P
R2016,R2016,16,P011,Naveen P,sibling_of,P002,Madhumitha P
R2017,R2017,17,P003,Palanisamy S,sibling_of,P016,Parvathi
R2018,R2018,18,P016,Parvathi,sibling_of,P003,Palanisamy S
R2019,R2019,19,P003,Palanisamy S,sibling_of,P021,Attai 1
R2020,R2020,20,P021,Attai 1,sibling_of,P003,Palanisamy S
R2021,R2021,21,P003,Palanisamy S,sibling_of,P022,Attai 2
R2022,R2022,22,P022,Attai 2,sibling_of,P003,Palanisamy S
R2023,R2023,23,P016,Parvathi,sibling_of,P021,Attai 1
R2024,R2024,24,P021,Attai 1,sibling_of,P016,Parvathi
R2025,R2025,25,P016,Parvathi,sibling_of,P022,Attai 2
R2026,R2026,26,P022,Attai 2,sibling_of,P016,Parvathi
R2027,R2027,27,P021,Attai 1,sibling_of,P022,Attai 2
R2028,R2028,28,P022,Attai 2,sibling_of,P021,Attai 1
R2029,R2029,29,P007,Songappan,grandparent_of,P001,Giri Prasath S P
R2030,R2030,30,P001,Giri Prasath S P,grandchild_of,P007,Songappan
R2031,R2031,31,P008,Lakshmi,grandparent_of,P001,Giri Prasath S P
R2032,R2032,32,P001,Giri Prasath S P,grandchild_of,P008,Lakshmi
R2033,R2033,33,P009,Ponnusamy,grandparent_of,P001,Giri Prasath S P
R2034,R2034,34,P001,Giri Prasath S P,grandchild_of,P009,Ponnusamy
R2035,R2035,35,P010,Thangammal,grandparent_of,P001,Giri Prasath S P
R2036,R2036,36,P001,Giri Prasath S P,grandchild_of,P010,Thangammal
R2037,R2037,37,P007,Songappan,grandparent_of,P013,Surya Prasath S P
R2038,R2038,38,P013,Surya Prasath S P,grandchild_of,P007,Songappan
R2039,R2039,39,P008,Lakshmi,grandparent_of,P013,Surya Prasath S P
R2040,R2040,40,P013,Surya Prasath S P,grandchild_of,P008,Lakshmi
R2041,R2041,41,P009,Ponnusamy,grandparent_of,P013,Surya Prasath S P
R2042,R2042,42,P013,Surya Prasath S P,grandchild_of,P009,Ponnusamy
R2043,R2043,43,P010,Thangammal,grandparent_of,P013,Surya Prasath S P
R2044,R2044,44,P013,Surya Prasath S P,grandchild_of,P010,Thangammal`;

const csvRel2 = `id,Autonumber,person_1_id,full_name (from person_1_id) 2,relationship_type,person_2_id,full_name (from person_2_id)
R1001,1,P001,Giri Prasath S P,married_to,P002,Madhumitha P
R1002,2,P003,Palanisamy S,married_to,P004,Mohanambal P
R1003,3,P005,Palanisamy K A,married_to,P006,Rajeshwari P
R1004,4,"P001,P013","Giri Prasath S P, Surya Prasath S P",child_of,"P003,P004","Palanisamy S, Mohanambal P"
R1005,5,"P002,P011","Madhumitha P, Naveen P",child_of,"P005,P006","Palanisamy K A, Rajeshwari P"
R1006,6,P007,Songappan,married_to,P008,Lakshmi
R1007,7,P009,Ponnusamy,married_to,P010,Thangammal
R1008,8,P011,Naveen P,married_to,P012,Nivedha S
R1009,9,P014,Somasundaram P,married_to,P015,Sumadhi C
R1010,10,P012,Nivedha S,child_of,"P014,P015","Somasundaram P, Sumadhi C"
R1011,11,"P003,P016,P021,P022","Palanisamy S, Parvathi, Attai 1, Attai 2",child_of,"P007,P008","Songappan, Lakshmi"
R1012,12,P004,Mohanambal P,child_of,"P009,P010","Ponnusamy, Thangammal"`;

const parseDate = (d) => {
  if (!d) return undefined;
  const parts = d.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${parts[2]}-${month}-${day}`;
  }
  return undefined;
};

async function run() {
  const peopleData = Papa.parse(csvPeople, { header: true, skipEmptyLines: true }).data;
  const rel3Data = Papa.parse(csvRel3, { header: true, skipEmptyLines: true }).data;
  const rel2Data = Papa.parse(csvRel2, { header: true, skipEmptyLines: true }).data;

  const membersMap = {};
  
  // Create actual uuid mapping
  const idMap = {};
  for (const row of peopleData) {
    if (!row.id || !row.full_name) continue;
    idMap[row.id] = crypto.randomUUID();
    
    // Parse name
    let firstName = row.full_name;
    let lastName = '';
    const parts = row.full_name.split(' ');
    if (parts.length > 1) {
      firstName = parts.slice(0, parts.length - 1).join(' ');
      lastName = parts[parts.length - 1];
    }
    
    // extra info
    const aliases = row.nickname || undefined;
    const birthDate = parseDate(row.birth);
    const deathDate = parseDate(row.death);
    const isDeceased = !!deathDate;
    
    const colors = ['bg-indigo-600 text-white', 'bg-emerald-600 text-white', 'bg-rose-600 text-white', 'bg-amber-600 text-white', 'bg-sky-600 text-white'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    let phone = row.mobile_1 || undefined;
    if (phone && phone.startsWith('+91') && phone.length === 13 && phone[3] !== ' ') {
        phone = '+91 ' + phone.substring(3);
    }
    let sPhone = row.mobile_2 || undefined;
    
    let gender = 'other';
    if (row.gender === 'male') gender = 'male';
    else if (row.gender === 'female') gender = 'female';
    
    let address = row.postal_address || undefined;
    if (!address && row.coordinates) {
        address = row.coordinates;
    }
    
    let notes = '';
    const bloodGroup = row.blood_group || undefined;

    membersMap[row.id] = {
      id: idMap[row.id],
      firstName,
      lastName,
      gender,
      birthDate,
      deathDate,
      isDeceased,
      aliases,
      phone,
      secondaryPhone: sPhone,
      email: row['mail id'] || undefined,
      address,
      bloodGroup,
      notes: notes.trim() || undefined,
      avatarColor
    };
  }

  // Relations mapping
  // Married To
  for (const r of [...rel3Data, ...rel2Data]) {
    if (r.relationship_type === 'married_to') {
      const p1 = r.person_1_id?.split(',').map(s=>s.trim());
      const p2 = r.person_2_id?.split(',').map(s=>s.trim());
      
      if (p1 && p1[0] && p2 && p2[0] && membersMap[p1[0]] && membersMap[p2[0]]) {
         membersMap[p1[0]].spouseId = idMap[p2[0]];
         membersMap[p2[0]].spouseId = idMap[p1[0]];
      }
    }
  }

  // Child Of / Parent Of
  // Using rel2Data (child_of)
  for (const r of rel2Data) {
    if (r.relationship_type === 'child_of') {
       const children = r.person_1_id?.split(',').map(s=>s.trim());
       const parents = r.person_2_id?.split(',').map(s=>s.trim());
       
       let fatherId = undefined;
       let motherId = undefined;
       
       parents.forEach(pId => {
           if (membersMap[pId]?.gender === 'male') fatherId = idMap[pId];
           if (membersMap[pId]?.gender === 'female') motherId = idMap[pId];
       });
       
       children.forEach(cId => {
          if (membersMap[cId]) {
              if (fatherId) membersMap[cId].fatherId = fatherId;
              if (motherId) membersMap[cId].motherId = motherId;
          }
       });
    }
  }

  // Using rel3Data (parent_of)
  for (const r of rel3Data) {
    if (r.relationship_type === 'parent_of') {
       const pId = r.person_1_id?.trim();
       const cId = r.person_2_id?.trim();
       
       if (membersMap[pId] && membersMap[cId]) {
           if (membersMap[pId].gender === 'male') {
               membersMap[cId].fatherId = idMap[pId];
           } else if (membersMap[pId].gender === 'female') {
               membersMap[cId].motherId = idMap[pId];
           }
       }
    }
  }

  const finalMembers = Object.values(membersMap);
  fs.writeFileSync('./public/airtable_import.json', JSON.stringify(finalMembers, null, 2));
  console.log("Wrote airtable_import.json!");
}

run();
