/**
 * components/FormWizard.js — Multi-step form navigator with progress stepper.
 */
import React from 'react';
import { Box, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses,
         Typography, Button, Paper, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 12 },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: { borderColor: theme.palette.primary.main },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: { borderColor: theme.palette.success.main },
  [`& .${stepConnectorClasses.line}`]: { borderTopWidth: 2, borderRadius: 1 },
}));

const StepIconRoot = styled('div')(({ ownerState, theme }) => ({
  color: ownerState.completed ? theme.palette.success.main
       : ownerState.active    ? theme.palette.primary.main
       : theme.palette.grey[400],
  display: 'flex', alignItems: 'center',
}));

function StepIconComponent(props) {
  const { active, completed } = props;
  return (
    <StepIconRoot ownerState={{ completed, active }}>
      {completed ? <CheckCircleIcon sx={{ fontSize: 26 }} />
                 : <RadioButtonUncheckedIcon sx={{ fontSize: 26 }} />}
    </StepIconRoot>
  );
}

const STEPS = [
  { key: 'personal',   label: 'Personal Info' },
  { key: 'education',  label: 'Education' },
  { key: 'employment', label: 'Employment' },
  { key: 'bank',       label: 'Bank Details' },
  { key: 'emergency',  label: 'Emergency Contact' },
  { key: 'consent',    label: 'Consent & Submit' },
];

export default function FormWizard({ currentStep, completedSteps = [], children, onNext, onBack, loading }) {
  const activeIndex    = STEPS.findIndex(s => s.key === currentStep);
  const progressValue  = ((completedSteps.length) / STEPS.length) * 100;

  return (
    <Box>
      {/* Progress bar */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress variant="determinate" value={progressValue}
          sx={{ flex: 1, height: 8, borderRadius: 4,
                '& .MuiLinearProgress-bar': { borderRadius: 4 } }} />
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {completedSteps.length}/{STEPS.length} steps
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeIndex} alternativeLabel connector={<ColorConnector />} sx={{ mb: 3 }}>
        {STEPS.map((step) => (
          <Step key={step.key} completed={completedSteps.includes(step.key)}>
            <StepLabel StepIconComponent={StepIconComponent}>
              <Typography variant="caption" sx={{ fontWeight: activeIndex === STEPS.indexOf(step) ? 700 : 400 }}>
                {step.label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step content */}
      <Paper sx={{ p: 3, mb: 2 }}>{children}</Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onBack} disabled={activeIndex === 0 || loading}>
          ← Back
        </Button>
        <Button variant="contained" onClick={onNext} disabled={loading}>
          {loading ? 'Saving...' : activeIndex === STEPS.length - 1 ? 'Submit Application' : 'Save & Continue →'}
        </Button>
      </Box>
    </Box>
  );
}

export { STEPS };
