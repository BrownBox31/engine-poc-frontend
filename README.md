The object inspection mechanism has the following flows

PRIMARY FLOW
1. Create object model in the system
2. Create checklist items for this model
3. Assign VIN to a model
4. Configure line, station & view setup for the VINs
5. Inspect the VINs
6. Rework on the VIN if required & resolve issues
7. Update SAP and clear VIN for further processing

ADMIN ROLE PATH (Brown Box / Inpinite)
  
  COMPANY CONFIGURATION
  1. Create a company (This will represent an actual organization and will have multiple plants under it)
  
  PLANT CONFIGURATION
  1. Create a plant ID (This will represent the actual location where lines will be setup. A plant can have multiple lines)
  
  LINE CONFIGURATION
  1. Create the line [lineNo, lineName, description(optional), status,lineLocation]
  2. Map workstations on that line
  3. Make the line active

  STATION CONFIGURATION
  1. Create the workstation if it does not exist [id, name, type(assemble,PDI,etc.), description(optional),views[]]  

MODELLER ROLE PATH
  
  CHECK LIST CONFIGURATION PATH
    1. Upload check list items / Input check list items via interface / Duplicate existing items and modify them
    2. Assign check list items to a model
    3. Modify existing items

  MODEL CONFIGURATION PATH
  1. Create the model (modelName,modelCode,modelMaker,modelYear) if it does not exists
  2. Map the check list items to the model
  3. Map VINs to the model
  4. Setup the inspection line
     a. Define workstations on the line where the vehicle would be inspected
     b. Define the views (A workstation might have only one person for inspection and in this case the view would be All. Other workstations might have two people and in such a scenario each person would inspect one view of the object) and the checklist items for each workstation
     c. If an existing configuration is present then copy it for the current model (Quality of Life Feature)
  5. A model can be assigned to different lines and each line can have its own configuration
  
  LINE CONFIGURATION PATH
  1. Activate / deactivate an existing line

INSPECTOR FLOW

  1. Login & select your line, workstation & view  
  2. Scan a VIN barcode to start its inspection
  3. Inspect the vehicle as per your inspection mode
  4. Complete the inspection by saying "rec off" and move on to the next inspection

REWORKER FLOW

  REWORK ON A VEHICLE
  1. Login to view the dashboard
  2. Click on a vehicle to view its issue
  3. Resolve the issues and submit the VIN (On submit a communication is made to the main system informing that the object is ready for dispatch)
  4. Move on to the next VIN

PLANT SUPERVISOR FLOW

  1. User Management ( Assign users to plant & lines)

LINE SUPERVISOR FLOW (Optional)

  1. User Management ( Assign users to lines)

Questions:
Is rework section line dependent ? i.e. would every line have its own rework station ?