# Data Dictionary

## Census 2011 Dataset

### Source

* Dataset: Basic Population Figures of India / State / District / Sub-District / Village - Census 2011
* Source: Census of India
* Data year: 2011
* Type: Historical demographic and workforce data
* Original file: `2011-IndiaStateDistSbDistVill-0000.xlsx`

---

## 1. Geographic / Location Fields

| Column         | Meaning                            | Project Use                          |
| -------------- | ---------------------------------- | ------------------------------------ |
| `State`        | State identifier/code              | Identify state                       |
| `District`     | District identifier/code           | Identify district                    |
| `Subdistt`     | Sub-district/tehsil identifier     | Identify smaller administrative area |
| `Town/Village` | Town/village identifier            | Identify locality                    |
| `Level`        | Administrative level of the record | Identify geographic level            |
| `Name`         | Name of geographic unit            | Display location name                |
| `Ward`         | Census ward identifier             | Not required initially               |
| `EB`           | Enumeration Block identifier       | Not required initially               |

---

## 2. Population Fields

| Column  | Meaning                    | Project Use                       |
| ------- | -------------------------- | --------------------------------- |
| `No_HH` | Number of households       | Estimate household/customer base  |
| `TOT_P` | Total population           | Estimate population/customer base |
| `TOT_M` | Total male population      | Demographic analysis              |
| `TOT_F` | Total female population    | Demographic analysis              |
| `P_06`  | Population aged 0–6        | Demographic analysis              |
| `M_06`  | Male population aged 0–6   | Demographic analysis              |
| `F_06`  | Female population aged 0–6 | Demographic analysis              |

---

## 3. Social Category Fields

| Column | Meaning                           | Project Use                    |
| ------ | --------------------------------- | ------------------------------ |
| `P_SC` | Total Scheduled Caste population  | Area-level demographic context |
| `M_SC` | Male Scheduled Caste population   | Area-level demographic context |
| `F_SC` | Female Scheduled Caste population | Area-level demographic context |
| `P_ST` | Total Scheduled Tribe population  | Area-level demographic context |
| `M_ST` | Male Scheduled Tribe population   | Area-level demographic context |
| `F_ST` | Female Scheduled Tribe population | Area-level demographic context |

These fields should be used only for appropriate aggregate demographic analysis and not to make discriminatory individual-level business recommendations.

---

## 4. Literacy Fields

| Column  | Meaning                      | Project Use                     |
| ------- | ---------------------------- | ------------------------------- |
| `P_LIT` | Total literate population    | Understand area-level literacy  |
| `M_LIT` | Male literate population     | Area-level demographic analysis |
| `F_LIT` | Female literate population   | Area-level demographic analysis |
| `P_ILL` | Total illiterate population  | Area-level demographic analysis |
| `M_ILL` | Male illiterate population   | Area-level demographic analysis |
| `F_ILL` | Female illiterate population | Area-level demographic analysis |

---

## 5. Workforce Fields

| Column       | Meaning                          | Project Use                              |
| ------------ | -------------------------------- | ---------------------------------------- |
| `TOT_WORK_P` | Total workers                    | Measure economic activity                |
| `TOT_WORK_M` | Total male workers               | Demographic analysis                     |
| `TOT_WORK_F` | Total female workers             | Demographic analysis                     |
| `MAINWORK_P` | Total main workers               | Understand established employment        |
| `MAIN_CL_P`  | Main cultivators                 | Agriculture-related opportunity analysis |
| `MAIN_AL_P`  | Main agricultural labourers      | Agriculture-related opportunity analysis |
| `MAIN_HH_P`  | Main household-industry workers  | Small/home-based business analysis       |
| `MAIN_OT_P`  | Main workers in other categories | General workforce analysis               |

---

## 6. Marginal Worker Fields

| Column       | Meaning                              | Project Use                    |
| ------------ | ------------------------------------ | ------------------------------ |
| `MARGWORK_P` | Total marginal workers               | Understand marginal employment |
| `MARG_CL_P`  | Marginal cultivators                 | Agriculture-related analysis   |
| `MARG_AL_P`  | Marginal agricultural labourers      | Agriculture-related analysis   |
| `MARG_HH_P`  | Marginal household-industry workers  | Home-based business analysis   |
| `MARG_OT_P`  | Marginal workers in other categories | General workforce analysis     |

The dataset also contains male/female versions and duration-based marginal worker fields such as `MARGWORK_3_6_P` and `MARGWORK_0_3_P`. These will be retained in the raw dataset and may be used in later analysis if required.

---

## 7. Important Data Quality Notes

* Census data is from 2011 and therefore represents historical conditions.
* It must not be presented as the current population of a village.
* The raw Census file must remain unchanged.
* A separate processed dataset will later contain only the fields required by the application.
* Census data alone cannot determine current competitors, current market prices, current infrastructure, or current business demand.
* Additional datasets will be required for hyper-local business feasibility analysis.
