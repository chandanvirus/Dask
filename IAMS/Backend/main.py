# from fastapi import FastAPI, Depends, HTTPException
# from database import engine, SessionLocal
# from db_models import Base, Employee
# from sqlalchemy.orm import Session
# from fastapi.middleware.cors import CORSMiddleware
# from db_models import Holiday
# from db_models import Attendance as AttendanceModel
# from typing import List
# from schemas import Attendance,LoginRequest
# # from fastapi import HTTPException
# # from schemas import LoginRequest

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # allow all origins (for development)
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Base.metadata.create_all(bind=engine)

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# @app.get("/")
# def home():
#     return {"message": "Attendance API running 🚀"}

# @app.get("/health")
# def health_check():
#     return {"status": "OK"}


# @app.post("/employees")
# def create_employee(name: str, email: str, department: str, role: str, db: Session = Depends(get_db)):
#     new_emp = Employee(
#         name=name,
#         email=email,
#         department=department,
#         role=role
#     )
#     db.add(new_emp)
#     db.commit()
#     db.refresh(new_emp)
#     return new_emp


# @app.get("/employees")
# def get_employees(db: Session = Depends(get_db)):
#     return db.query(Employee).all()

   

# @app.post("/holidays")
# def create_holiday(name: str, date: str, db: Session = Depends(get_db)):
#     new_holiday = Holiday(
#         name=name,
#         date=date
#     )
#     db.add(new_holiday)
#     db.commit()
#     db.refresh(new_holiday)
#     return new_holiday


# @app.get("/holidays")
# def get_holidays(db: Session = Depends(get_db)):
#     return db.query(Holiday).all()

# @app.post("/attendance")
# def mark_attendance(data: Attendance, db: Session = Depends(get_db)):

#     record = AttendanceModel(
#         employee=data.employee,
#         date=data.date,
#         check_in=data.check_in,
#         check_out=data.check_out,
#         status=data.status
#     )

#     db.add(record)
#     db.commit()

#     return {"message": "Attendance saved"}


# @app.get("/attendance", response_model=List[Attendance])
# def get_attendance(db: Session = Depends(get_db)):
#     return db.query(AttendanceModel).all()


# @app.post("/login")
# def login(data: LoginRequest, db: Session = Depends(get_db)):

#     user: Employee | None = db.query(Employee).filter(Employee.email == data.email).first()
#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     if user.password != data.password:
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     return {
#         "id": user.id,
#         "name": user.name,
#         "email": user.email,
#         "role": user.role,
#         "department": user.department
#     }





from fastapi import FastAPI, Depends, HTTPException
from database import engine, SessionLocal
from db_models import Base, Employee, Holiday, Leave
from db_models import Attendance as AttendanceModel
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from schemas import Attendance, LoginRequest, LoginResponse, LeaveCreate, EmployeeCreate, EmployeeUpdate


app = FastAPI()


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create tables
Base.metadata.create_all(bind=engine)


# Database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------
# Basic Routes
# ---------------------------

@app.get("/")
def home():
    return {"message": "Attendance API running 🚀"}


@app.get("/health")
def health_check():
    return {"status": "OK"}


# ---------------------------
# Employee APIs
# ---------------------------

@app.post("/employees")
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):

    new_emp = Employee(
        name=data.name,
        email=data.email,
        department=data.department,
        role=data.role,
        salary=data.salary,
        password=data.password,
        photo=None
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return new_emp


@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()


@app.put("/employees/{employee_id}", response_model=LoginResponse)
def update_employee(employee_id: int, data: EmployeeUpdate, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing_email = (
        db.query(Employee)
        .filter(Employee.email == data.email, Employee.id != employee_id)
        .first()
    )

    if existing_email:
        raise HTTPException(status_code=400, detail="Email already in use")

    employee.name = data.name
    employee.email = data.email
    employee.department = data.department
    employee.photo = data.photo

    db.commit()
    db.refresh(employee)

    return employee


# ---------------------------
# Holiday APIs
# ---------------------------

@app.post("/holidays")
def create_holiday(name: str, date: str, db: Session = Depends(get_db)):

    new_holiday = Holiday(
        name=name,
        date=date
    )

    db.add(new_holiday)
    db.commit()
    db.refresh(new_holiday)

    return new_holiday


@app.get("/holidays")
def get_holidays(db: Session = Depends(get_db)):
    return db.query(Holiday).all()


# ---------------------------
# Attendance APIs
# ---------------------------

@app.post("/attendance")
def mark_attendance(data: Attendance, db: Session = Depends(get_db)):

    record = AttendanceModel(
        employee=data.employee,
        date=data.date,
        check_in=data.check_in,
        check_out=data.check_out,
        status=data.status
    )

    db.add(record)
    db.commit()

    return {"message": "Attendance saved"}


@app.get("/attendance", response_model=List[Attendance])
def get_attendance(db: Session = Depends(get_db)):

    records = db.query(AttendanceModel).all()

    return records


# ---------------------------
# Login API
# ---------------------------
@app.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(Employee).filter(Employee.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.password != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    requested_role = data.role.strip().lower()
    actual_role = user.role.strip().lower()

    if requested_role != actual_role:
        raise HTTPException(status_code=403, detail="Use the correct login option for this account")

    return user



# ---------------------------
# Leave APIs
# ---------------------------

@app.post("/leaves")
def apply_leave(data: LeaveCreate, db: Session = Depends(get_db)):

    new_leave = Leave(
        employee=data.employee,
        leave_type=data.leave_type,
        from_date=data.from_date,
        to_date=data.to_date,
        reason=data.reason,
        status="Pending"
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return new_leave


@app.get("/leaves")
def get_leaves(db: Session = Depends(get_db)):
    return db.query(Leave).all()


@app.put("/leaves/{leave_id}")
def update_leave_status(leave_id: int, status: str, db: Session = Depends(get_db)):

    leave = db.query(Leave).filter(Leave.id == leave_id).first()

    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")

    leave.status = status
    db.commit()

    return {"message": "Leave updated"}
