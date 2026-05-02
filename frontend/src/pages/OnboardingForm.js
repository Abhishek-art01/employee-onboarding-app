/**
 * pages/OnboardingForm.js — 6-step wizard: personal → education → employment
 *   → bank → emergency → consent.
 * Each step auto-saves to backend on "Save & Continue".
 */
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Grid, MenuItem, FormControlLabel,
         Checkbox, Alert, CircularProgress, Divider, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import FormWizard, { STEPS } from '../components/FormWizard';
import { onboardingService }   from '../services/onboardingService';
import { verificationService } from '../services/verificationService';
import VerifiedIcon from '@mui/icons-material/Verified';

// ── Reusable field ────────────────────────────────────────────────
const F = ({ label, name, register, errors, required, type='text', options, ...rest }) => {
  if (options) {
    return (
      <TextField select fullWidth label={label} defaultValue=""
        {...register(name, { required: required && `${label} is required` })}
        error={!!errors[name]} helperText={errors[name]?.message} {...rest}>
        {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
      </TextField>
    );
  }
  return (
    <TextField fullWidth label={label} type={type}
      {...register(name, { required: required && `${label} is required` })}
      error={!!errors[name]} helperText={errors[name]?.message} {...rest} />
  );
};

// ── Step Components ───────────────────────────────────────────────
function PersonalStep({ register, errors, existingData, onVerify }) {
  const [verifying, setVerifying]       = useState({});
  const [verified,  setVerified]        = useState({ aadhaar: existingData?.aadhaarVerified, pan: existingData?.panVerified });

  const handleVerify = async (type, value) => {
    setVerifying(p => ({ ...p, [type]: true }));
    try {
      let res;
      if (type === 'aadhaar') res = await verificationService.verifyAadhaar(value);
      else                    res = await verificationService.verifyPAN(value);
      if (res.verified) {
        setVerified(p => ({ ...p, [type]: true }));
        toast.success(`${type.toUpperCase()} verified!`);
      } else {
        toast.error(res.message || `${type.toUpperCase()} verification failed.`);
      }
    } catch(err) { toast.error(err.message || 'Verification error.'); }
    finally { setVerifying(p => ({ ...p, [type]: false })); }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600}>Personal Information</Typography></Grid>
      <Grid item xs={12} sm={6}><F label="First Name" name="firstName" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Last Name"  name="lastName"  register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Date of Birth" name="dob" type="date" register={register} errors={errors} required InputLabelProps={{ shrink:true }} /></Grid>
      <Grid item xs={12} sm={6}>
        <F label="Gender" name="gender" register={register} errors={errors} required
          options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other / Prefer not to say'}]} />
      </Grid>
      <Grid item xs={12} sm={6}><F label="Nationality" name="nationality" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Mobile Number" name="mobile" register={register} errors={errors} required /></Grid>
      <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Identity Verification</Typography></Divider></Grid>
      <Grid item xs={12} sm={8}><F label="Aadhaar Number (12 digits)" name="aadhaarNumber" register={register} errors={errors} required inputProps={{ maxLength:12 }} /></Grid>
      <Grid item xs={12} sm={4} sx={{ display:'flex', alignItems:'flex-start' }}>
        <Button variant="outlined" fullWidth sx={{ mt:0.5 }}
          onClick={() => handleVerify('aadhaar', document.querySelector('[name=aadhaarNumber]')?.value)}
          disabled={verifying.aadhaar || verified.aadhaar}
          startIcon={verified.aadhaar ? <VerifiedIcon color="success" /> : (verifying.aadhaar ? <CircularProgress size={16}/> : null)}>
          {verified.aadhaar ? 'Verified ✓' : verifying.aadhaar ? 'Verifying...' : 'Verify Aadhaar'}
        </Button>
      </Grid>
      <Grid item xs={12} sm={8}><F label="PAN Number (e.g. ABCDE1234F)" name="panNumber" register={register} errors={errors} required inputProps={{ maxLength:10, style:{textTransform:'uppercase'} }} /></Grid>
      <Grid item xs={12} sm={4} sx={{ display:'flex', alignItems:'flex-start' }}>
        <Button variant="outlined" fullWidth sx={{ mt:0.5 }}
          onClick={() => handleVerify('pan', document.querySelector('[name=panNumber]')?.value)}
          disabled={verifying.pan || verified.pan}
          startIcon={verified.pan ? <VerifiedIcon color="success" /> : (verifying.pan ? <CircularProgress size={16}/> : null)}>
          {verified.pan ? 'Verified ✓' : verifying.pan ? 'Verifying...' : 'Verify PAN'}
        </Button>
      </Grid>
      <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">Address</Typography></Divider></Grid>
      <Grid item xs={12}><F label="Current Address" name="currentAddress" register={register} errors={errors} required multiline rows={2} /></Grid>
      <Grid item xs={12} sm={6}><F label="City" name="city" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={3}><F label="State" name="state" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={3}><F label="PIN Code" name="pinCode" register={register} errors={errors} required /></Grid>
    </Grid>
  );
}

function EducationStep({ register, errors }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600}>Educational Qualifications</Typography></Grid>
      <Grid item xs={12}><Divider><Typography variant="caption">Highest Qualification</Typography></Divider></Grid>
      <Grid item xs={12} sm={6}>
        <F label="Degree / Qualification" name="highestDegree" register={register} errors={errors} required
          options={[
            {value:'10th',label:'10th (SSC)'},{value:'12th',label:'12th (HSC)'},
            {value:'diploma',label:'Diploma'},{value:'graduate',label:"Bachelor's Degree"},
            {value:'postgraduate',label:"Master's Degree"},{value:'phd',label:'PhD / Doctorate'},
          ]} />
      </Grid>
      <Grid item xs={12} sm={6}><F label="Specialisation / Stream" name="specialisation" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="University / Board" name="university" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={3}><F label="Year of Passing" name="passingYear" type="number" register={register} errors={errors} required inputProps={{ min:1970, max:new Date().getFullYear() }} /></Grid>
      <Grid item xs={12} sm={3}><F label="Percentage / CGPA" name="percentage" register={register} errors={errors} required /></Grid>
      <Grid item xs={12}><Divider><Typography variant="caption">Additional Certifications (optional)</Typography></Divider></Grid>
      <Grid item xs={12}><F label="Certifications (e.g. AWS, PMP, CFA — comma separated)" name="certifications" register={register} errors={errors} /></Grid>
    </Grid>
  );
}

function EmploymentStep({ register, errors }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600}>Employment Details</Typography></Grid>
      <Grid item xs={12} sm={6}><F label="Designation / Role Applied For" name="designation" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Department" name="department" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Expected Date of Joining" name="joiningDate" type="date" register={register} errors={errors} required InputLabelProps={{ shrink:true }} /></Grid>
      <Grid item xs={12} sm={6}>
        <F label="Employment Type" name="employmentType" register={register} errors={errors} required
          options={[{value:'full_time',label:'Full Time'},{value:'part_time',label:'Part Time'},
            {value:'contract',label:'Contract'},{value:'intern',label:'Internship'}]} />
      </Grid>
      <Grid item xs={12}><Divider><Typography variant="caption">Previous Employment (if applicable)</Typography></Divider></Grid>
      <Grid item xs={12} sm={6}><F label="Previous Employer" name="prevEmployer" register={register} errors={errors} /></Grid>
      <Grid item xs={12} sm={6}><F label="Previous Designation" name="prevDesignation" register={register} errors={errors} /></Grid>
      <Grid item xs={12} sm={3}><F label="From" name="prevFrom" type="month" register={register} errors={errors} InputLabelProps={{ shrink:true }} /></Grid>
      <Grid item xs={12} sm={3}><F label="To"   name="prevTo"   type="month" register={register} errors={errors} InputLabelProps={{ shrink:true }} /></Grid>
      <Grid item xs={12} sm={6}><F label="Last Drawn CTC (₹ per annum)" name="prevCtc" type="number" register={register} errors={errors} /></Grid>
      <Grid item xs={12}><F label="Reason for Leaving" name="reasonLeaving" register={register} errors={errors} multiline rows={2} /></Grid>
    </Grid>
  );
}

function BankStep({ register, errors }) {
  const [verifying, setVerifying] = useState(false);
  const [verified,  setVerified]  = useState(false);

  const handleVerifyBank = async () => {
    const acc  = document.querySelector('[name=accountNumber]')?.value;
    const ifsc = document.querySelector('[name=ifscCode]')?.value;
    const name = document.querySelector('[name=accountHolder]')?.value;
    if (!acc || !ifsc || !name) { toast.error('Fill account details first.'); return; }
    setVerifying(true);
    try {
      const res = await verificationService.verifyBank(acc, ifsc, name);
      if (res.verified) { setVerified(true); toast.success(`Bank verified! (${res.bankName})`); }
      else toast.error(res.message || 'Bank verification failed.');
    } catch(err) { toast.error(err.message || 'Error.'); }
    finally { setVerifying(false); }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600}>Bank Account Details</Typography></Grid>
      <Alert severity="info" sx={{ mx:2, mt:1, width:'100%' }}>
        Your bank details are AES-256 encrypted before storage and never displayed in plain text.
      </Alert>
      <Grid item xs={12}><F label="Account Holder Name (as per bank records)" name="accountHolder" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Account Number" name="accountNumber" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Confirm Account Number" name="confirmAccountNumber" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="IFSC Code" name="ifscCode" register={register} errors={errors} required inputProps={{ maxLength:11, style:{textTransform:'uppercase'} }} /></Grid>
      <Grid item xs={12} sm={6}><F label="Bank Name" name="bankName" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Branch Name" name="branchName" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}>
        <F label="Account Type" name="accountType" register={register} errors={errors} required
          options={[{value:'savings',label:'Savings'},{value:'current',label:'Current'},{value:'salary',label:'Salary'}]} />
      </Grid>
      <Grid item xs={12}>
        <Button variant="outlined" onClick={handleVerifyBank} disabled={verifying || verified}
          startIcon={verified ? <VerifiedIcon color="success" /> : verifying ? <CircularProgress size={16}/> : null}>
          {verified ? 'Bank Account Verified ✓' : verifying ? 'Verifying via Penny Drop...' : 'Verify Bank Account'}
        </Button>
      </Grid>
    </Grid>
  );
}

function EmergencyStep({ register, errors }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600}>Emergency Contact</Typography></Grid>
      <Grid item xs={12} sm={6}><F label="Contact Person Name" name="emergencyName" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Relationship" name="relationship" register={register} errors={errors} required
        options={[{value:'spouse',label:'Spouse'},{value:'parent',label:'Parent'},{value:'sibling',label:'Sibling'},
          {value:'child',label:'Child'},{value:'friend',label:'Friend'},{value:'other',label:'Other'}]} /></Grid>
      <Grid item xs={12} sm={6}><F label="Mobile Number" name="emergencyMobile" register={register} errors={errors} required /></Grid>
      <Grid item xs={12} sm={6}><F label="Alternate Number" name="emergencyAltMobile" register={register} errors={errors} /></Grid>
      <Grid item xs={12}><F label="Address" name="emergencyAddress" register={register} errors={errors} multiline rows={2} /></Grid>
    </Grid>
  );
}

function ConsentStep({ register, errors }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}><Typography variant="subtitle1" fontWeight={600}>Consent & Declaration</Typography></Grid>
      <Grid item xs={12}>
        <Alert severity="info">
          Please read each statement carefully. Your consent is required to complete the onboarding process and is stored in compliance with applicable data protection laws.
        </Alert>
      </Grid>
      {[
        { name:'consentDataProcessing', label:'I consent to the processing of my personal data by the company for employment and onboarding purposes.' },
        { name:'consentAadhaarStorage', label:'I consent to the storage and use of my Aadhaar information for identity verification as permitted by the Aadhaar Act.' },
        { name:'consentBackgroundCheck', label:'I consent to background verification checks including employment history, education, and criminal record checks.' },
        { name:'declarationAccuracy',   label:'I declare that all information provided in this form is true, accurate, and complete to the best of my knowledge.' },
      ].map(({ name, label }) => (
        <Grid item xs={12} key={name}>
          <FormControlLabel
            control={<Checkbox {...register(name, { required:'This consent is required.' })} color="primary" />}
            label={<Typography variant="body2">{label}</Typography>} />
          {errors[name] && <Typography variant="caption" color="error">{errors[name].message}</Typography>}
        </Grid>
      ))}
    </Grid>
  );
}

// ── Main Wizard Page ──────────────────────────────────────────────
const STEP_COMPONENTS = [PersonalStep, EducationStep, EmploymentStep, BankStep, EmergencyStep, ConsentStep];

export default function OnboardingFormPage() {
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const { register, handleSubmit, reset, formState:{ errors } } = useForm();

  useEffect(() => {
    onboardingService.getMyForm()
      .then(res => {
        setForm(res.form);
        const idx = Math.max(0, STEPS.findIndex(s => s.key === res.form.current_step));
        setStepIdx(idx < STEPS.length ? idx : STEPS.length - 1);
        if (res.form.form_data?.[STEPS[idx]?.key]) reset(res.form.form_data[STEPS[idx].key]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentStep = STEPS[stepIdx];
  const StepComp    = STEP_COMPONENTS[stepIdx];
  const completed   = Object.keys(form?.form_data || {});

  const onSave = async (data) => {
    setSaving(true);
    try {
      const updated = await onboardingService.saveStep(currentStep.key, data);
      setForm(updated.form);
      if (stepIdx < STEPS.length - 1) {
        setStepIdx(i => i + 1);
        reset({});
        toast.success(`Step "${currentStep.label}" saved!`);
      } else {
        toast.success('🎉 Application submitted successfully!');
      }
    } catch(err) { toast.error(err.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <Layout><Box sx={{ display:'flex', justifyContent:'center', pt:8 }}><CircularProgress /></Box></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth:860, mx:'auto' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Onboarding Form</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Complete all steps to submit your onboarding application.
        </Typography>

        {form?.status === 'approved' ? (
          <Alert severity="success" sx={{ mb:2 }}>Your onboarding application has been approved!</Alert>
        ) : (
          <FormWizard currentStep={currentStep.key} completedSteps={completed}
            onNext={handleSubmit(onSave)} onBack={() => setStepIdx(i => Math.max(0, i-1))}
            loading={saving}>
            <Typography variant="h6" mb={2}>{currentStep.label}</Typography>
            <StepComp register={register} errors={errors} existingData={form?.form_data?.[currentStep.key]} />
          </FormWizard>
        )}
      </Box>
    </Layout>
  );
}
